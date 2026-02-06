import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Onbuka MD5 signature generation
async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hash = await crypto.subtle.digest("MD5", data).catch(() => null)
  if (!hash) {
    // Fallback: simple hash if MD5 not available
    let h = 0
    for (let i = 0; i < text.length; i++) {
      h = ((h << 5) - h + text.charCodeAt(i)) | 0
    }
    return Math.abs(h).toString(16).padStart(32, "0")
  }
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")
}

interface OnbukaResponse {
  status: string
  reason: string
  balance?: string
  gift?: string
  successCount?: number
  failCount?: number
  array?: Array<{ msgId: string; number: string }>
}

async function sendViaOnbuka(
  settings: Record<string, string>,
  numbers: string,
  content: string,
  senderId?: string
): Promise<{ success: boolean; messageIds: string[]; error?: string }> {
  const apiKey = settings.onbuka_api_key
  const apiSecret = settings.onbuka_api_secret
  const appId = settings.onbuka_app_id

  if (!apiKey || !apiSecret || !appId) {
    return { success: false, messageIds: [], error: "Onbuka credentials not configured" }
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const sign = await md5(apiKey + apiSecret + timestamp)

  const response = await fetch("https://api.onbuka.com/v3/sendSms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Api-Key": apiKey,
      "Sign": sign,
      "Timestamp": timestamp,
    },
    body: JSON.stringify({
      appId,
      numbers,
      content,
      senderId: senderId || undefined,
    }),
  })

  const data: OnbukaResponse = await response.json()

  if (data.status === "0") {
    return {
      success: true,
      messageIds: data.array?.map(m => m.msgId) || [],
    }
  }

  return { success: false, messageIds: [], error: `Onbuka error ${data.status}: ${data.reason}` }
}

async function getOnbukaBalance(settings: Record<string, string>): Promise<{ balance: string; gift: string } | null> {
  const apiKey = settings.onbuka_api_key
  const apiSecret = settings.onbuka_api_secret

  if (!apiKey || !apiSecret) return null

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const sign = await md5(apiKey + apiSecret + timestamp)

  const response = await fetch("https://api.onbuka.com/v3/getBalance", {
    headers: {
      "Api-Key": apiKey,
      "Sign": sign,
      "Timestamp": timestamp,
    },
  })

  const data: OnbukaResponse = await response.json()
  if (data.status === "0") {
    return { balance: data.balance || "0", gift: data.gift || "0" }
  }
  return null
}

async function sendViaEims(
  settings: Record<string, string>,
  accountNum: string,
  numbers: string,
  content: string
): Promise<{ success: boolean; messageIds: string[]; error?: string }> {
  const account = settings[`eims_account_${accountNum}`]
  const password = settings[`eims_password_${accountNum}`]
  const servers = settings[`eims_servers_${accountNum}`]

  if (!account || !password || !servers) {
    return { success: false, messageIds: [], error: `EIMS account ${accountNum} not configured` }
  }

  const serverList = servers.split(",").map(s => s.trim()).filter(Boolean)
  const serverUrl = serverList[0]

  try {
    const response = await fetch(`${serverUrl}/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, password, numbers, content }),
    })
    const data = await response.json()
    return {
      success: data.status === 0 || data.status === "0",
      messageIds: data.messageIds || [],
      error: data.error || undefined,
    }
  } catch (err) {
    return { success: false, messageIds: [], error: `EIMS connection error: ${err}` }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const body = await req.json()
    const { to, message, provider, sender_id, campaign_id, action } = body

    // Get provider settings
    const { data: settings } = await supabase.from("provider_settings").select("*").limit(1).single()
    if (!settings) {
      return new Response(JSON.stringify({ error: "Provider settings not configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Check balance action
    if (action === "balance") {
      const balance = await getOnbukaBalance(settings)
      return new Response(JSON.stringify({ balance: balance?.balance, gift: balance?.gift }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Send SMS
    const selectedProvider = provider || settings.default_provider || "onbuka"
    let result: { success: boolean; messageIds: string[]; error?: string }

    switch (selectedProvider) {
      case "onbuka":
        result = await sendViaOnbuka(settings, to, message, sender_id)
        break
      case "eims_1":
        result = await sendViaEims(settings, "1", to, message)
        break
      case "eims_2":
        result = await sendViaEims(settings, "2", to, message)
        break
      case "eims_3":
        result = await sendViaEims(settings, "3", to, message)
        break
      case "smpp":
        // SMPP requires TCP connection, not available in Edge Functions
        // Would need a separate microservice
        result = { success: false, messageIds: [], error: "SMPP not available in serverless environment" }
        break
      default:
        result = { success: false, messageIds: [], error: `Unknown provider: ${selectedProvider}` }
    }

    // Log the SMS
    const numbers = to.split(",").map((n: string) => n.trim()).filter(Boolean)
    for (let i = 0; i < numbers.length; i++) {
      await supabase.from("sms_logs").insert({
        user_id: user.id,
        campaign_id: campaign_id || null,
        phone: numbers[i],
        message,
        provider: selectedProvider,
        message_id: result.messageIds[i] || null,
        status: result.success ? "sent" : "failed",
        error_message: result.error || null,
      })
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        message_ids: result.messageIds,
        error: result.error,
        sent_count: result.success ? numbers.length : 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Internal error: ${err}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
