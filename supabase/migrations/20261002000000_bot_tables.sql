-- Tables for the Telegram poster bot (project: Urban Tutor Side Ad).
-- Nothing here is readable or writable with the public key: only the Edge Functions (service role) touch it.

-- who may use the bot (the admins come from the ADMIN_ID secret and never need a row)
create table if not exists public.allowed_users (
  telegram_id bigint primary key,
  name text,
  added_at timestamptz not null default now()
);
alter table public.allowed_users add column if not exists username text not null default '';

-- people who sent /start and wait for an admin to press Approve / Reject
create table if not exists public.pending_approvals (
  telegram_id bigint primary key,
  name text not null default '',
  username text not null default '',
  admin_msgs jsonb not null default '{}',     -- admin chat id -> message id, so the request can be removed everywhere
  wait_msg_id bigint,
  start_msg_id bigint,
  requested_at timestamptz not null default now()
);

-- where each person is in the "Hi" question-by-question chat
create table if not exists public.bot_sessions (
  chat_id bigint primary key,
  step text not null default '',
  data jsonb not null default '{}',
  tracked bigint[] not null default '{}',     -- messages to delete when the posters are sent
  updated_at timestamptz not null default now()
);

-- one row per poster request (chat or form), for history
create table if not exists public.ad_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  telegram_id bigint,
  source text check (source in ('chat', 'form')),
  tutor_type text,
  class_board text,
  subject text,
  city text,
  location text,
  pin_code text,
  status text check (status in ('done', 'failed')),
  error text
);
create index if not exists ad_log_created_idx on public.ad_log (created_at desc);

alter table public.allowed_users enable row level security;
alter table public.pending_approvals enable row level security;
alter table public.bot_sessions enable row level security;
alter table public.ad_log enable row level security;

grant select, insert, update, delete on public.allowed_users, public.pending_approvals, public.bot_sessions, public.ad_log to service_role;
