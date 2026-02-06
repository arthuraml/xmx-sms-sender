import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    const body = await req.json()

    // Handle Onbuka delivery reports
    // Onbuka pushes delivery status updates to configured webhook URL
    if (body.msgId && body.status !== undefined) {
      const status = body.status === "0" ? "delivered" : "failed"
      const now = new Date().toISOString()

      // Update sms_logs
      await supabase.from("sms_logs").update({
        status,
        delivered_at: status === "delivered" ? now : null,
        error_message: status === "failed" ? `Delivery failed: ${body.status}` : null,
      }).eq("message_id", body.msgId)

      // Update campaign_recipients
      const { data: recipient } = await supabase
        .from("campaign_recipients")
        .select("*, campaigns(id)")
        .eq("message_id", body.msgId)
        .single()

      if (recipient) {
        await supabase.from("campaign_recipients").update({
          status,
          delivered_at: status === "delivered" ? now : null,
          error_message: status === "failed" ? `Delivery failed: ${body.status}` : null,
        }).eq("id", recipient.id)

        // Update campaign counters
        const campaignId = (recipient.campaigns as { id: string })?.id
        if (campaignId) {
          if (status === "delivered") {
            await supabase.rpc("increment_campaign_delivered", { cid: campaignId })
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Handle batch delivery reports (array format)
    if (Array.isArray(body)) {
      for (const report of body) {
        if (report.msgId) {
          const status = report.status === "0" ? "delivered" : "failed"
          await supabase.from("sms_logs").update({
            status,
            delivered_at: status === "delivered" ? new Date().toISOString() : null,
          }).eq("message_id", report.msgId)
        }
      }
      return new Response(JSON.stringify({ success: true, processed: body.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Webhook error: ${err}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
