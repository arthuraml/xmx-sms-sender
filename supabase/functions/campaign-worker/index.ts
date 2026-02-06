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
    const { campaign_id } = await req.json()

    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get campaign
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single()

    if (!campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get pending recipients
    const { data: recipients } = await supabase
      .from("campaign_recipients")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("status", "pending")
      .limit(1000)

    if (!recipients || recipients.length === 0) {
      // Campaign complete
      await supabase.from("campaigns").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", campaign_id)

      return new Response(JSON.stringify({ status: "completed", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Process in batches of 100 (Onbuka GET limit)
    const batchSize = 100
    let sentCount = 0
    let failCount = 0

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      const numbers = batch.map(r => r.phone).join(",")

      // Call send-sms function
      const { data: result, error } = await supabase.functions.invoke("send-sms", {
        body: {
          to: numbers,
          message: campaign.message,
          provider: campaign.provider,
          sender_id: campaign.sender_id,
          campaign_id,
        },
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
      })

      if (error || !result?.success) {
        // Mark batch as failed
        for (const r of batch) {
          await supabase.from("campaign_recipients").update({
            status: "failed",
            error_message: error?.message || result?.error || "Send failed",
          }).eq("id", r.id)
        }
        failCount += batch.length
      } else {
        // Mark batch as sent
        for (let j = 0; j < batch.length; j++) {
          await supabase.from("campaign_recipients").update({
            status: "sent",
            message_id: result.message_ids?.[j] || null,
            sent_at: new Date().toISOString(),
          }).eq("id", batch[j].id)
        }
        sentCount += batch.length
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Update campaign counters
    await supabase.from("campaigns").update({
      sent_count: campaign.sent_count + sentCount,
      failed_count: campaign.failed_count + failCount,
    }).eq("id", campaign_id)

    return new Response(
      JSON.stringify({ status: "processing", sent: sentCount, failed: failCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Worker error: ${err}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
