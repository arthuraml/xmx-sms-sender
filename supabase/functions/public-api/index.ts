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

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/public-api\/?/, "/").replace(/\/+/g, "/")

  // Authenticate via API key
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing API key" }, 401)
  }

  const apiKey = authHeader.replace("Bearer ", "")
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(apiKey))
  const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")

  const { data: keyRecord } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single()

  if (!keyRecord) {
    return json({ error: "Invalid API key" }, 401)
  }

  // Update last used
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id)

  const userId = keyRecord.user_id

  // Router
  try {
    if (path === "/health" || path === "/") {
      return json({
        status: "ok",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        endpoints: ["/sendsms", "/balance", "/status/:id", "/campaign", "/campaign/:id", "/logs", "/health"],
      })
    }

    if (path === "/sendsms" && req.method === "POST") {
      const body = await req.json()
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { ...body, user_id: userId },
      })
      if (error) return json({ error: error.message }, 500)
      return json(data)
    }

    if (path === "/balance") {
      const { data: settings } = await supabase.from("provider_settings").select("*").limit(1).single()
      return json({ balance: settings ? "Available" : "No provider configured" })
    }

    if (path.startsWith("/status/")) {
      const msgId = path.replace("/status/", "")
      const { data } = await supabase.from("sms_logs").select("*").eq("message_id", msgId).single()
      return json(data || { error: "Not found" })
    }

    if (path === "/campaign" && req.method === "GET") {
      const { data } = await supabase.from("campaigns").select("*").eq("user_id", userId).order("created_at", { ascending: false })
      return json(data || [])
    }

    if (path === "/campaign" && req.method === "POST") {
      const body = await req.json()
      const { data, error } = await supabase.from("campaigns").insert({ ...body, user_id: userId }).select().single()
      if (error) return json({ error: error.message }, 400)
      return json(data)
    }

    if (path.match(/^\/campaign\/[\w-]+$/) && req.method === "GET") {
      const id = path.split("/")[2]
      const { data } = await supabase.from("campaigns").select("*").eq("id", id).eq("user_id", userId).single()
      return json(data || { error: "Not found" })
    }

    if (path.match(/^\/campaign\/[\w-]+$/) && req.method === "PUT") {
      const id = path.split("/")[2]
      const body = await req.json()
      const { data, error } = await supabase.from("campaigns").update(body).eq("id", id).eq("user_id", userId).select().single()
      if (error) return json({ error: error.message }, 400)
      return json(data)
    }

    if (path.match(/^\/campaign\/[\w-]+$/) && req.method === "DELETE") {
      const id = path.split("/")[2]
      await supabase.from("campaigns").delete().eq("id", id).eq("user_id", userId)
      return json({ success: true })
    }

    if (path === "/logs") {
      const limit = parseInt(url.searchParams.get("limit") || "100")
      const { data } = await supabase.from("sms_logs").select("*").eq("user_id", userId).order("sent_at", { ascending: false }).limit(limit)
      return json(data || [])
    }

    return json({ error: "Not found" }, 404)
  } catch (err) {
    return json({ error: `Internal error: ${err}` }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
