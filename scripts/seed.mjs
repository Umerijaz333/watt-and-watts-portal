// Seeds three demo clients with requirements, notes and tasks.
// Run after create-users.mjs. Refuses to run if clients already exist (pass --force to add anyway).
// Usage: node --env-file=.env.local scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
const addDays = (n) => {
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();
const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const { count } = await supabase.from("clients").select("id", { count: "exact", head: true });
if (count && !process.argv.includes("--force")) {
  console.log(`clients already has ${count} rows; not seeding (use --force).`);
  process.exit(0);
}

const profiles = must(await supabase.from("profiles").select("id, role"));
const umer = profiles.find((p) => p.role === "admin")?.id ?? null;
const ahmed = profiles.find((p) => p.role === "simple")?.id ?? null;
if (!umer || !ahmed) console.warn("Warning: users not found; run create-users.mjs first for proper authorship.");

const [c1, c2, c3] = must(
  await supabase
    .from("clients")
    .insert([
      {
        name: "Ayesha Malik", firm: "Malik & Partners Architects", phone: "+92 300 1234567",
        email: "ayesha@malikpartners.pk", city: "Lahore", type: "architect", stage: "quotation_sent",
        discussed_summary: "DHA Phase 6 villa. Wants warm white (2700K) recessed downlights for living areas and linear profiles in the kitchen.",
        next_to_discuss: "Confirm dimming system (DALI vs phase-cut) and final ceiling cut-out sizes.",
        pending_from_client: "Revised reflected ceiling plan", pending_from_us: "Revised quotation with DALI drivers",
        next_follow_up: addDays(-2), created_by: umer,
      },
      {
        name: "Bilal Ahmed", firm: "Skyline Builders", phone: "+92 321 7654321", city: "Lahore",
        type: "builder", stage: "meeting_done",
        discussed_summary: "Gulberg commercial plaza, 8 floors. Interested in façade wash lighting and corridor panels.",
        next_to_discuss: "Sample of façade wash fixture and IP rating.",
        pending_from_client: "Floor plans for corridors", pending_from_us: "Arrange sample fixture",
        next_follow_up: today, created_by: ahmed,
      },
      {
        name: "Sana Qureshi", firm: "Studio Noor Interiors", phone: "+92 333 5558899", city: "Islamabad",
        type: "interior_designer", stage: "first_contact",
        discussed_summary: "Met at the design expo. Boutique hotel project in F-7.",
        next_to_discuss: "Send catalogue and book a showroom visit.",
        next_follow_up: addDays(3), created_by: umer,
      },
    ])
    .select("id"),
).map((r) => r.id);

must(await supabase.from("client_requirements").insert([
  { client_id: c1, product_text: "Recessed COB downlight 10W 2700K", quantity: 48, notes: "Trimless, white" },
  { client_id: c1, product_text: "Linear aluminium profile with diffuser, 2m", quantity: 12, notes: "Kitchen under-cabinet" },
  { client_id: c2, product_text: "Façade wash light 36W RGBW", quantity: 30, notes: "IP66 required" },
  { client_id: c2, product_text: "LED panel 600x600 40W", quantity: 120 },
]));

must(await supabase.from("notes").insert([
  { client_id: c1, body: "Site visit done. Client liked the trimless downlight sample.", next_follow_up: addDays(-5), created_by: ahmed, created_at: ago(9) },
  { client_id: c1, body: "Sent quotation for 48 downlights and 12 linear profiles.", pending_from_client: "Revised reflected ceiling plan", next_follow_up: addDays(-2), created_by: umer, created_at: ago(4) },
  { client_id: c2, body: "First meeting at their Gulberg office. Discussed façade and corridors.", pending_from_client: "Floor plans for corridors", next_follow_up: today, created_by: ahmed, created_at: ago(2) },
  { client_id: c3, body: "Met at the expo, exchanged cards.", next_follow_up: addDays(3), created_by: umer, created_at: ago(1) },
]));

must(await supabase.from("tasks").insert([
  { title: "Prepare revised quotation with DALI drivers", owner: umer, due_date: today, status: "doing", client_id: c1, created_by: umer },
  { title: "Take façade wash sample to Skyline site", owner: ahmed, due_date: addDays(1), status: "todo", client_id: c2, created_by: umer },
  { title: "Email catalogue to Studio Noor", owner: umer, due_date: addDays(2), status: "todo", client_id: c3, created_by: umer },
]));

console.log("Seeded 3 clients, 4 requirements, 4 notes, 3 tasks.");
