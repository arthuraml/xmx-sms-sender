-- XMX-SMS-Sender Database Schema

-- Enum types
create type user_role as enum ('admin', 'user');
create type sms_provider as enum ('onbuka', 'eims_1', 'eims_2', 'eims_3', 'smpp');
create type campaign_status as enum ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed');
create type sms_status as enum ('pending', 'sent', 'delivered', 'failed', 'rejected');

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role user_role default 'user' not null,
  credits numeric(12, 2) default 0 not null,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Provider settings (admin only, single row)
create table provider_settings (
  id uuid default gen_random_uuid() primary key,
  onbuka_api_key text,
  onbuka_api_secret text,
  onbuka_app_id text,
  eims_account_1 text,
  eims_password_1 text,
  eims_servers_1 text,
  eims_account_2 text,
  eims_password_2 text,
  eims_servers_2 text,
  eims_account_3 text,
  eims_password_3 text,
  eims_servers_3 text,
  smpp_host text default 'smpp.kftel.hk',
  smpp_port integer default 20003,
  smpp_system_id text,
  smpp_password text,
  default_provider sms_provider default 'onbuka' not null,
  updated_at timestamptz default now() not null
);

alter table provider_settings enable row level security;
create policy "Admin can manage provider settings" on provider_settings
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
-- Allow all authenticated users to read (needed for send-sms function)
create policy "Authenticated users can read provider settings" on provider_settings
  for select using (auth.uid() is not null);

-- Contacts
create table contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade default auth.uid() not null,
  name text not null,
  phone text not null,
  email text,
  tags text[] default '{}',
  metadata jsonb,
  created_at timestamptz default now() not null
);

create index contacts_user_id_idx on contacts(user_id);
create index contacts_phone_idx on contacts(phone);

alter table contacts enable row level security;
create policy "Users can manage own contacts" on contacts
  for all using (auth.uid() = user_id);

-- Contact groups
create table contact_groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade default auth.uid() not null,
  name text not null,
  description text,
  created_at timestamptz default now() not null
);

alter table contact_groups enable row level security;
create policy "Users can manage own groups" on contact_groups
  for all using (auth.uid() = user_id);

-- Contact group members (N:N)
create table contact_group_members (
  contact_id uuid references contacts on delete cascade not null,
  group_id uuid references contact_groups on delete cascade not null,
  primary key (contact_id, group_id)
);

alter table contact_group_members enable row level security;
create policy "Users can manage own group members" on contact_group_members
  for all using (
    exists (select 1 from contact_groups where id = group_id and user_id = auth.uid())
  );

-- Campaigns
create table campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade default auth.uid() not null,
  name text not null,
  message text not null,
  sender_id text,
  provider sms_provider default 'onbuka' not null,
  status campaign_status default 'draft' not null,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  total_recipients integer default 0 not null,
  sent_count integer default 0 not null,
  delivered_count integer default 0 not null,
  failed_count integer default 0 not null,
  created_at timestamptz default now() not null
);

create index campaigns_user_id_idx on campaigns(user_id);
create index campaigns_status_idx on campaigns(status);

alter table campaigns enable row level security;
create policy "Users can manage own campaigns" on campaigns
  for all using (auth.uid() = user_id);

-- Campaign recipients
create table campaign_recipients (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references campaigns on delete cascade not null,
  contact_id uuid references contacts on delete set null,
  phone text not null,
  status sms_status default 'pending' not null,
  message_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text
);

create index campaign_recipients_campaign_id_idx on campaign_recipients(campaign_id);
create index campaign_recipients_status_idx on campaign_recipients(status);

alter table campaign_recipients enable row level security;
create policy "Users can manage own campaign recipients" on campaign_recipients
  for all using (
    exists (select 1 from campaigns where id = campaign_id and user_id = auth.uid())
  );

-- SMS logs
create table sms_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade default auth.uid() not null,
  campaign_id uuid references campaigns on delete set null,
  phone text not null,
  message text not null,
  provider sms_provider not null,
  message_id text,
  status sms_status default 'pending' not null,
  cost numeric(10, 4),
  sent_at timestamptz default now() not null,
  delivered_at timestamptz,
  error_message text
);

create index sms_logs_user_id_idx on sms_logs(user_id);
create index sms_logs_sent_at_idx on sms_logs(sent_at desc);
create index sms_logs_status_idx on sms_logs(status);

alter table sms_logs enable row level security;
create policy "Users can view own logs" on sms_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on sms_logs
  for insert with check (auth.uid() = user_id);

-- API keys
create table api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade default auth.uid() not null,
  key_hash text not null,
  key_preview text not null,
  name text not null,
  last_used_at timestamptz,
  created_at timestamptz default now() not null,
  is_active boolean default true not null
);

alter table api_keys enable row level security;
create policy "Users can manage own API keys" on api_keys
  for all using (auth.uid() = user_id);

-- Flow templates
create table flow_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade default auth.uid() not null,
  name text not null,
  description text,
  flow_data jsonb default '{}' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table flow_templates enable row level security;
create policy "Users can manage own flows" on flow_templates
  for all using (auth.uid() = user_id);
