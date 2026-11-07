-- Watt & Watts: remove demo data and add one example client.
-- Run once in Supabase → SQL Editor, AFTER 20261108000000_review_inbox.sql.
-- Safe to run more than once.

begin;

-- 1. Remove the demo clients (their notes, photos and requirements go with them).
delete from tasks
where title in (
  'Prepare revised quotation with DALI drivers',
  'Take façade wash sample to Skyline site',
  'Email catalogue to Studio Noor'
);
delete from clients where name in ('Ayesha Malik', 'Bilal Ahmed', 'Sana Qureshi');

-- 2. One example client showing how to fill things in.
--    No follow-up date, so it never appears in Overdue / Due today.
do $$
declare
  -- Umer's profile, if set up (otherwise the example has no author).
  umer uuid := (select p.id from profiles p join auth.users u on u.id = p.id
                where lower(u.email) = 'umerijaz992@gmail.com');
  c uuid;
begin
  if exists (select 1 from clients where name = 'EXAMPLE – Sample Architect') then
    return;
  end if;

  insert into clients (name, firm, phone, email, city, type, stage,
                       discussed_summary, next_to_discuss, pending_from_client, pending_from_us,
                       next_follow_up, created_by, reviewed_at)
  values ('EXAMPLE – Sample Architect', 'Sample Design Studio', '0300 0000000', null, 'Lahore',
          'architect', 'meeting_done',
          'House in DHA Phase 6. Wants warm white (3000K) downlights in living and dining, and strip lights in the kitchen.',
          'Show samples of trimless downlights. Confirm number of rooms and ceiling height.',
          'Final ceiling drawings',
          'Send price list and sample photos',
          null, umer, now())
  returning id into c;

  insert into client_requirements (client_id, product_text, quantity, notes) values
    (c, 'Recessed downlight 10W 3000K', 40, 'White, trimless'),
    (c, 'LED strip light with profile, 2m', 8, 'Kitchen under-cabinet');

  insert into notes (client_id, body, pending_from_client, next_follow_up, created_by, reviewed_at) values
    (c, 'Met at their office. Saw the house plans. They liked our trimless downlight sample. Will send ceiling drawings this week.',
        'Final ceiling drawings', null, umer, now());
end $$;

commit;

-- Check: should list only your real clients plus the example.
select name, firm, stage, next_follow_up from clients order by name;
