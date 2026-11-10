import Link from "@/components/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { meetingWhen } from "@/lib/outreach";
import { formatDateTime } from "@/lib/dates";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Meeting brief" };

const CHECKLIST = [
  "Bring the catalogue and samples",
  "Ask what projects are running now",
  "Ask who decides on lighting",
  "Ask which product types and quantities they use",
  "Agree the next follow-up date before leaving",
];

export default async function MeetingBrief({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [, { data: m, error }] = await Promise.all([
    requireAdmin(),
    supabase
      .from("meetings")
      .select("id, scheduled_for, scheduled_time, place, status, assigned:profiles!meetings_assigned_to_fkey(name), client:clients(*)")
      .eq("id", id)
      .maybeSingle(),
  ]);
  if (error) throw error;
  if (!m) notFound();
  const c = (Array.isArray(m.client) ? m.client[0] : m.client) as Record<string, string | null> & { id: string; name: string };
  const assigned = (Array.isArray(m.assigned) ? m.assigned[0] : m.assigned) as { name: string } | null;

  const [{ data: colleagues }, { data: notes }] = await Promise.all([
    c.firm_group
      ? supabase.from("clients").select("id, name, designation, mobile, landline, phone").eq("firm_group", c.firm_group).neq("id", c.id).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string; designation: string | null; mobile: string | null; landline: string | null; phone: string | null }[] }),
    supabase
      .from("notes")
      .select("id, body, created_at, author:profiles(name)")
      .eq("client_id", c.id)
      .not("body", "like", "Follow-up moved to %")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const phones = [c.mobile && `Mobile: ${c.mobile}`, c.landline && `Landline: ${c.landline}`, !c.mobile && !c.landline && c.phone && `Phone: ${c.phone}`].filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl space-y-5 rounded-3xl bg-surface p-6 shadow-soft print:max-w-none print:rounded-none print:p-0 print:shadow-none">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/plan" className="text-sm font-semibold text-link">← Weekly plan</Link>
        <PrintButton label="Print brief" />
      </div>

      <header className="border-b-2 border-navy pb-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Meeting brief · Watt &amp; Watts</p>
        <h1 className="font-display text-3xl font-bold text-navy">{c.name}</h1>
        <p className="text-lg">{[c.designation, c.firm].filter(Boolean).join(" · ")}</p>
        <p className="mt-1 font-semibold">
          {meetingWhen(m.scheduled_for, m.scheduled_time)}
          {assigned?.name ? ` · ${assigned.name} attending` : ""}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Where</h2>
          <p>{m.place || c.address || "—"}</p>
          {c.area && <p className="text-muted">{c.area}, Lahore</p>}
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Phones</h2>
          {phones.length ? phones.map((p) => <p key={p as string}>{p}</p>) : <p>—</p>}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Also at this firm</h2>
        {colleagues?.length ? (
          <ul className="mt-1 space-y-0.5">
            {colleagues.map((p) => (
              <li key={p.id}>
                {p.name}
                {p.designation ? `, ${p.designation}` : ""}
                {p.mobile || p.landline || p.phone ? ` · ${p.mobile || p.landline || p.phone}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Nobody else listed.</p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Earlier notes</h2>
        {notes?.length ? (
          <ul className="mt-1 space-y-2">
            {notes.map((n) => {
              const a = (Array.isArray(n.author) ? n.author[0] : n.author) as { name: string } | null;
              return (
                <li key={n.id} className="border-l-4 border-tint-strong pl-3">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="text-sm text-muted">{a?.name ?? "—"} · {formatDateTime(n.created_at)}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted">First meeting: no notes yet.</p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Checklist</h2>
        <ul className="mt-1 space-y-1.5">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 border-2 border-ink" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="print:block">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Notes from the meeting</h2>
        <div className="mt-1 h-40 rounded-xl border-2 border-dashed border-line print:h-56 print:border-gray-400" />
        <p className="mt-1 text-sm">Next follow-up date: ____________________</p>
      </section>
    </article>
  );
}
