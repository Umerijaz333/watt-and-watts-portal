// Creates (or updates) the two portal users and their profiles.
// Usage:
//   node --env-file=.env.local scripts/create-users.mjs \
//     --admin-email umer@example.com --admin-password '...' \
//     --simple-email ahmed@example.com --simple-password '...'
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
import { createClient } from "@supabase/supabase-js";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, arr) => (v.startsWith("--") ? [...acc, [v.slice(2), arr[i + 1]]] : acc), []),
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local).");
  process.exit(1);
}

const users = [
  { email: args["admin-email"], password: args["admin-password"], name: args["admin-name"] ?? "Umer", role: "admin" },
  { email: args["simple-email"], password: args["simple-password"], name: args["simple-name"] ?? "Ahmed", role: "simple" },
];
for (const u of users) {
  if (!u.email || !u.password) {
    console.error("Missing --admin-email/--admin-password/--simple-email/--simple-password");
    process.exit(1);
  }
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserByEmail(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

for (const u of users) {
  let user = await findUserByEmail(u.email);
  if (user) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: u.password, email_confirm: true });
    if (error) throw error;
    console.log(`Updated password for ${u.email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true });
    if (error) throw error;
    user = data.user;
    console.log(`Created ${u.email}`);
  }
  const { error: pErr } = await supabase.from("profiles").upsert({ id: user.id, name: u.name, role: u.role });
  if (pErr) throw pErr;
  console.log(`  profile: ${u.name} (${u.role})`);
}
console.log("Done.");
