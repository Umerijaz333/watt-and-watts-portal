# Watt & Watts Portal (MVP)

Internal follow-up and client-history portal for Watt & Watts, Lahore.
Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Vercel · installable PWA.

- **Umer** (`admin`): dashboard `/`, clients `/clients`, client profile `/clients/[id]`, tasks `/tasks`.
- **Ahmed** (`simple`): phone-first home `/ahmed` with three buttons → note, photo, follow-ups (plus a small "My tasks" link).

## 1. Supabase setup

1. Create a Supabase project.
2. **Auth → Providers → Email**: keep Email enabled, turn **off** "Allow new users to sign up". (Optional: turn off "Confirm email"; the user script confirms emails anyway.)
3. **SQL Editor**: run `supabase/migrations/20261107000000_init.sql`, then `supabase/migrations/20261108000000_review_inbox.sql`. It creates all tables, RLS policies, the `clients.updated_at` trigger, and the private `note-photos` bucket with its policies.
   Or with the CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`.
4. Copy `.env.example` to `.env.local` and fill in the project URL, anon key and service role key (Project Settings → API).

## 2. Create the two users

```bash
node --env-file=.env.local scripts/create-users.mjs --admin-email umer@YOURDOMAIN --admin-password 'CHOOSE-A-PASSWORD' --simple-email ahmed@YOURDOMAIN --simple-password 'CHOOSE-A-PASSWORD'
```

Creates both auth users (email pre-confirmed) and their `profiles` rows (`Umer`/admin, `Ahmed`/simple). Re-running it resets the passwords. Optional: `--admin-name`, `--simple-name`.

## 3. Seed demo data (optional)

```bash
node --env-file=.env.local scripts/seed.mjs
```

Adds 3 clients (one overdue, one due today, one in 3 days), requirements, 4 notes and 3 tasks. Skips if clients already exist.

## 4. Run locally

```bash
npm install
npm run dev
```

## 5. Deploy to Vercel

1. Import the GitHub repo in Vercel (framework: Next.js, defaults are fine).
2. Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **Do not** add the service role key.
3. Deploy, then in Supabase **Auth → URL Configuration** set Site URL to the Vercel URL.
4. On the phone: open the URL → Share → "Add to Home Screen" (iOS) or ⋮ → "Install app" (Android).

## Local Supabase (optional)

`npx supabase start` runs the full stack in Docker and applies the migration (sign-up is disabled in `supabase/config.toml`). If ghcr.io is blocked, prefix with `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`.

## Behaviour notes

- Saving a note sets `clients.next_follow_up` to the note's date and, if filled in, overwrites `clients.pending_from_client`. Editing a note later does not touch the client.
- Overdue = `next_follow_up` before today; Due today = equal to today. "Today" is computed in Asia/Karachi. Dates show as `07 Nov 2026`.
- Role checks are enforced in the UI/server layouts (`simple` users are redirected from admin pages to `/ahmed`). The database is open to any authenticated user, as specified.
- Photos are resized in the browser (max 2000px JPEG) before upload, stored at `note-photos/<client_id>/…`, and displayed via 1-hour signed URLs.
