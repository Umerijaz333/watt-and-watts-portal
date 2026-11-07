-- Watt & Watts Portal: initial schema

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role text not null check (role in ('admin','simple'))
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  firm text,
  phone text,
  email text,
  city text,
  type text check (type in ('architect','builder','interior_designer','end_client','other')) default 'architect',
  stage text check (stage in ('first_contact','meeting_done','quotation_sent','negotiating','order_placed','lost')) default 'first_contact',
  discussed_summary text,
  next_to_discuss text,
  pending_from_client text,
  pending_from_us text,
  next_follow_up date,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table client_requirements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  product_text text not null,
  quantity int,
  notes text,
  created_at timestamptz default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  body text not null,
  pending_from_client text,
  next_follow_up date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table note_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner uuid references profiles(id),
  due_date date,
  status text check (status in ('todo','doing','done')) default 'todo',
  client_id uuid references clients(id) on delete set null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Helpful indexes
create index clients_next_follow_up_idx on clients (next_follow_up);
create index client_requirements_client_idx on client_requirements (client_id);
create index notes_client_idx on notes (client_id, created_at desc);
create index note_photos_client_idx on note_photos (client_id, created_at desc);
create index tasks_owner_idx on tasks (owner);

-- updated_at trigger on clients
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_set_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- created_by defaults to the logged-in user
alter table clients     alter column created_by set default auth.uid();
alter table notes       alter column created_by set default auth.uid();
alter table note_photos alter column created_by set default auth.uid();
alter table tasks       alter column created_by set default auth.uid();

-- RLS: two trusted users, any authenticated user has full access
alter table profiles            enable row level security;
alter table clients             enable row level security;
alter table client_requirements enable row level security;
alter table notes               enable row level security;
alter table note_photos         enable row level security;
alter table tasks               enable row level security;

create policy "authenticated full access" on profiles            for all to authenticated using (true) with check (true);
create policy "authenticated full access" on clients             for all to authenticated using (true) with check (true);
create policy "authenticated full access" on client_requirements for all to authenticated using (true) with check (true);
create policy "authenticated full access" on notes               for all to authenticated using (true) with check (true);
create policy "authenticated full access" on note_photos         for all to authenticated using (true) with check (true);
create policy "authenticated full access" on tasks               for all to authenticated using (true) with check (true);

-- Private storage bucket for photos of notes
insert into storage.buckets (id, name, public)
values ('note-photos', 'note-photos', false)
on conflict (id) do nothing;

create policy "note-photos read" on storage.objects
  for select to authenticated using (bucket_id = 'note-photos');
create policy "note-photos upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'note-photos');
create policy "note-photos delete" on storage.objects
  for delete to authenticated using (bucket_id = 'note-photos');
