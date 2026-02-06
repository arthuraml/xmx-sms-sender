export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: "admin" | "user"
  credits: number
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  phone: string
  email: string | null
  tags: string[]
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ContactGroup {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  message: string
  sender_id: string | null
  provider: SmsProvider
  status: CampaignStatus
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  total_recipients: number
  sent_count: number
  delivered_count: number
  failed_count: number
  created_at: string
}

export interface CampaignRecipient {
  id: string
  campaign_id: string
  contact_id: string | null
  phone: string
  status: SmsStatus
  message_id: string | null
  sent_at: string | null
  delivered_at: string | null
  error_message: string | null
}

export interface SmsLog {
  id: string
  user_id: string
  campaign_id: string | null
  phone: string
  message: string
  provider: SmsProvider
  message_id: string | null
  status: SmsStatus
  cost: number | null
  sent_at: string
  delivered_at: string | null
  error_message: string | null
}

export interface ApiKey {
  id: string
  user_id: string
  key_hash: string
  key_preview: string
  name: string
  last_used_at: string | null
  created_at: string
  is_active: boolean
}

export interface ProviderSettings {
  id: string
  onbuka_api_key: string | null
  onbuka_api_secret: string | null
  onbuka_app_id: string | null
  eims_account_1: string | null
  eims_password_1: string | null
  eims_servers_1: string | null
  eims_account_2: string | null
  eims_password_2: string | null
  eims_servers_2: string | null
  eims_account_3: string | null
  eims_password_3: string | null
  eims_servers_3: string | null
  smpp_host: string | null
  smpp_port: number | null
  smpp_system_id: string | null
  smpp_password: string | null
  default_provider: SmsProvider
  updated_at: string
}

export interface FlowTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  flow_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type SmsProvider = "onbuka" | "eims_1" | "eims_2" | "eims_3" | "smpp"
export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "completed" | "failed"
export type SmsStatus = "pending" | "sent" | "delivered" | "failed" | "rejected"

export interface DashboardStats {
  totalSent: number
  totalDelivered: number
  totalFailed: number
  deliveryRate: number
  activeCampaigns: number
  totalContacts: number
}
