import Link from "@/components/link";
import { NoteIcon } from "@/components/icons";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTimeline, getLastNotes } from "@/lib/queries";
import { LastSpoke } from "@/components/last-spoke";
import { FollowUpActions } from "@/components/followup-actions";
import { Timeline } from "@/components/timeline";
import { formatDate } from "@/lib/dates";
import { StageChip } from "@/components/stage-chip";
import { Avatar } from "@/components/avatar";

export default async function AhmedClientSummary({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: c, error }, timeline, last] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    getTimeline(id, 5),
    getLastNotes([id]),
  ]);
  if (error) throw error;
  if (!c) notFound();

  const rows: [string, string | null][] = [
    ["Call them again on", formatDate(c.next_follow_up)],
    ["What we have discussed", c.discussed_summary],
    ["What to talk about next", c.next_to_discuss],
    ["They are waiting on us for", c.pending_from_us],
  ];

  return (
    <div className="space-y-5">
      <Link href="/ahmed/followups" className="text-lg font-semibold text-link">← Follow-ups</Link>
      <div className="flex items-start gap-4">
        <Avatar name={c.name} size={64} />
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold leading-tight text-navy">{c.name}</h1>
          {c.firm && <p className="text-xl">{c.firm}</p>}
          <StageChip stage={c.stage} className="mt-2 text-base" />
        </div>
      </div>

      <div className="grid gap-3">
        <Link href={`/ahmed/note?client=${c.id}`} className="btn-primary w-full py-5 text-2xl"><NoteIcon size={28} /> Write down what you talked about</Link>
      </div>

      <LastSpoke note={last.get(c.id)} pending={c.pending_from_client} large />
      <FollowUpActions clientId={c.id} phone={c.phone} name={c.name} />

      <dl className="card space-y-3">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-lg font-bold text-navy">{k}</dt>
            <dd className="whitespace-pre-wrap text-xl">{v || "—"}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-navy">Recent history</h2>
        <Timeline items={timeline} large />
      </section>
    </div>
  );
}
