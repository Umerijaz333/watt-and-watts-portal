-- Review inbox: track which notes, photos and new clients have been reviewed.
-- Safe to run more than once.
alter table notes       add column if not exists reviewed_at timestamptz;
alter table note_photos add column if not exists reviewed_at timestamptz;
alter table clients     add column if not exists reviewed_at timestamptz;

-- Everything that already exists counts as reviewed, so the inbox starts empty.
update notes       set reviewed_at = now() where reviewed_at is null;
update note_photos set reviewed_at = now() where reviewed_at is null;
update clients     set reviewed_at = now() where reviewed_at is null;

create index if not exists notes_unreviewed_idx       on notes (created_at desc)       where reviewed_at is null;
create index if not exists note_photos_unreviewed_idx on note_photos (created_at desc) where reviewed_at is null;
create index if not exists clients_unreviewed_idx     on clients (created_at desc)     where reviewed_at is null;
