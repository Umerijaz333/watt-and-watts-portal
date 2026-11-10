-- Orders, sent & received: what a client ordered, what we will send / have sent,
-- and what we received back from them. Safe to run more than once.
create table if not exists client_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  kind text not null check (kind in ('ordered', 'to_send', 'sent', 'received')),
  description text not null,
  quantity int,
  item_date date,
  notes text,
  created_by uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);

create index if not exists client_items_client_idx on client_items (client_id, created_at desc);

alter table client_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'client_items' and policyname = 'authenticated full access') then
    create policy "authenticated full access" on client_items for all to authenticated using (true) with check (true);
  end if;
end $$;
