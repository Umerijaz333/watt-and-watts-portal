-- Architect directory and weekly outreach. Safe to run more than once.

-- Stage gains 'not_contacted' (the default for imported architects).
alter table clients drop constraint if exists clients_stage_check;
alter table clients add constraint clients_stage_check
  check (stage in ('not_contacted','first_contact','meeting_done','quotation_sent','negotiating','order_placed','lost'));
alter table clients alter column stage set default 'not_contacted';

alter table clients
  add column if not exists source_id text,
  add column if not exists designation text,
  add column if not exists address text,
  add column if not exists area text,
  add column if not exists landline text,
  add column if not exists mobile text,
  add column if not exists phones_raw text,
  add column if not exists tier text check (tier in ('A','B','C')),
  add column if not exists firm_group text,
  add column if not exists firm_contacts int default 1,
  add column if not exists is_firm_primary boolean default true,
  add column if not exists suggested_rank int,
  add column if not exists ahmed_pick boolean default false,
  add column if not exists ahmed_pick_order int,
  add column if not exists skipped boolean default false,
  add column if not exists needs_review boolean default false,
  add column if not exists review_flags text,
  add column if not exists duplicate_of text,
  add column if not exists source_raw text;

create unique index if not exists clients_source_id_key on clients (source_id);
create index if not exists clients_queue_idx on clients (stage, is_firm_primary, skipped, tier);
create index if not exists clients_firm_group_idx on clients (firm_group);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  scheduled_for date not null,
  scheduled_time time,
  place text,
  assigned_to uuid references profiles(id),
  status text not null check (status in ('planned','done','skipped','rescheduled')) default 'planned',
  outcome_note text,
  needs_reschedule boolean not null default false,  -- set when Ahmed taps "Can't make it"
  created_by uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);
create index if not exists meetings_week_idx on meetings (scheduled_for, status);
create index if not exists meetings_client_idx on meetings (client_id);

alter table meetings enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'meetings' and policyname = 'authenticated full access') then
    create policy "authenticated full access" on meetings for all to authenticated using (true) with check (true);
  end if;
end $$;
