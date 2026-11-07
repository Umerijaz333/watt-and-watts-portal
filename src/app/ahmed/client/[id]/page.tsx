import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTimeline } from "@/lib/queries";
import { Timeline } from "@/components/timeline";
import { formatDate } from "@/lib/dates";
import { stageLabel } from "@/lib/constants";

export default async function AhmedClientSummary({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: c, error }, timeline] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    getTimeline(id, 5),
  ]);
  if (error) throw error;
  if (!c) notFound();

  const rows: [string, string | null][] = [
    ["Next follow-up", formatDate(c.next_follow_up)],
    ["Stage", stageLabel(c.stage)],
    ["Discussed so far", c.discussed_summary],
    ["Next to discuss", c.next_to_discuss],
    ["Pending from client", c.pending_from_client],
    ["Pending from us", c.pending_from_us],
  ];

  return (
    <div className="space-y-5">
      <Link href="/ahmed/followups" className="text-lg font-semibold text-brand">← Follow-ups</Link>
      <div>
        <h1 className="text-3xl font-bold">{c.name}</h1>
        {c.firm && <p className="text-xl text-muted">{c.firm}</p>}
      </div>

      <div className="grid gap-3">
        <Link href={`/ahmed/note?client=${c.id}`} className="btn-primary w-full py-5 text-2xl">📝 Add note</Link>
        {c.phone && (
          <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="btn-secondary w-full border-2 py-4 text-xl">📞 Call {c.phone}</a>
        )}
      </div>

      <dl className="card space-y-3">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-lg font-semibold text-muted">{k}</dt>
            <dd className="whitespace-pre-wrap text-xl">{v || "—"}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="mb-2 text-2xl font-bold">Recent history</h2>
        <Timeline items={timeline} large />
      </section>
    </div>
  );
}
