import Link from "@/components/link";
import { getQueue, getBusyFirms, firmKey, type QueueRow } from "@/lib/outreach";
import { requireAdmin } from "@/lib/auth";
import { QueueActions } from "@/components/queue-actions";
import { Avatar } from "@/components/avatar";
import { telHref } from "@/lib/phone";

type Search = { area?: string; tier?: string; q?: string; review?: string; skipped?: string; all?: string };

export default async function QueuePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const [, queue, busy] = await Promise.all([requireAdmin(), getQueue({ includeSkipped: sp.skipped === "1" }), getBusyFirms()]);

  const areas = [...new Set(queue.map((r) => r.area).filter(Boolean))].sort() as string[];
  const term = (sp.q ?? "").trim().toLowerCase();
  let rows = queue.filter((r) => (sp.skipped === "1" ? r.skipped : !r.skipped));
  if (sp.area) rows = rows.filter((r) => r.area === sp.area);
  if (sp.tier === "A" || sp.tier === "B") rows = rows.filter((r) => r.tier === sp.tier);
  if (sp.review === "1") rows = rows.filter((r) => r.needs_review);
  if (term) rows = rows.filter((r) => [r.name, r.firm, r.designation, r.area, r.address, r.phone].some((v) => v?.toLowerCase().includes(term)));

  const picks = rows.filter((r) => r.ahmed_pick);
  const rest = rows.filter((r) => !r.ahmed_pick);
  const LIMIT = 40;
  const shownRest = sp.all === "1" ? rest : rest.slice(0, LIMIT);
  const qs = (patch: Partial<Search>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/queue${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Who to meet next</h1>
          <p className="text-muted">
            {queue.filter((r) => !r.skipped).length} firms not contacted yet · one row per firm · Ahmed&apos;s picks first
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/queue/print" className="btn-secondary">Print list for Ahmed</Link>
          <Link href="/plan" className="btn-primary">Weekly plan</Link>
        </div>
      </div>

      <form className="grid gap-2 sm:grid-cols-[1fr_12rem_8rem_auto]" role="search">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name, firm, area, phone" aria-label="Search the queue" className="input" />
        <select name="area" defaultValue={sp.area ?? ""} aria-label="Area" className="input">
          <option value="">All areas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select name="tier" defaultValue={sp.tier ?? ""} aria-label="Tier" className="input">
          <option value="">Tier A + B</option>
          <option value="A">Tier A only</option>
          <option value="B">Tier B only</option>
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={qs({ review: sp.review === "1" ? undefined : "1" })} className={`rounded-full px-3 py-1 font-semibold ${sp.review === "1" ? "bg-navy text-white" : "bg-surface text-navy shadow-soft"}`}>
          Needs review ({queue.filter((r) => r.needs_review && !r.skipped).length})
        </Link>
        <Link href={qs({ skipped: sp.skipped === "1" ? undefined : "1" })} className={`rounded-full px-3 py-1 font-semibold ${sp.skipped === "1" ? "bg-navy text-white" : "bg-surface text-navy shadow-soft"}`}>
          {sp.skipped === "1" ? "Showing skipped" : "Show skipped"}
        </Link>
        {(sp.q || sp.area || sp.tier || sp.review || sp.skipped) && <Link href="/queue" className="px-2 py-1 font-semibold text-link underline">Clear filters</Link>}
      </div>

      {rows.length === 0 ? (
        <p className="card text-muted">Nobody matches these filters. <Link href="/queue" className="font-semibold text-link">Clear filters</Link></p>
      ) : (
        <>
          {picks.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-bold text-navy">Ahmed&apos;s picks ({picks.length})</h2>
              <ul className="list-card">{picks.map((r, i) => <QueueItem key={r.id} r={r} busy={busy.has(firmKey(r))} first={i === 0} last={i === picks.length - 1} />)}</ul>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-bold text-navy">{picks.length ? "Then, in suggested order" : "In suggested order"} ({rest.length})</h2>
              <ul className="list-card">{shownRest.map((r) => <QueueItem key={r.id} r={r} busy={busy.has(firmKey(r))} first last />)}</ul>
              {shownRest.length < rest.length && (
                <Link href={qs({ all: "1" })} className="btn-secondary mt-3">Show all {rest.length}</Link>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function QueueItem({ r, busy, first, last }: { r: QueueRow; busy: boolean; first: boolean; last: boolean }) {
  const num = r.mobile || r.landline || r.phone;
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 gap-3">
        <Avatar name={r.name} size={40} />
        <div className="min-w-0">
          <Link href={`/clients/${r.id}`} className="font-semibold text-navy hover:underline">{r.name}</Link>
          <p className="text-sm text-muted">{[r.designation, r.firm].filter(Boolean).join(" · ") || "—"}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {r.area && <span className="rounded-full bg-tint px-2 py-0.5 text-xs font-semibold text-navy">{r.area}</span>}
            {r.tier && <span className="text-xs text-muted">Tier {r.tier}</span>}
            {r.suggested_rank && <span className="text-xs text-muted">#{r.suggested_rank}</span>}
            {num ? <a href={telHref(num)} className="font-semibold text-link">{num}</a> : <span className="text-xs text-overdue">No phone</span>}
            {busy && <span className="rounded-full bg-done-tint px-2 py-0.5 text-xs font-semibold text-done">Meeting planned</span>}
            {r.needs_review && (
              <span className="rounded-full bg-overdue-tint px-2 py-0.5 text-xs font-semibold text-overdue" title="From automatic PDF parsing; please check">
                Check: {r.review_flags?.replace(/_/g, " ")}
                {r.duplicate_of ? ` (maybe same as ${r.duplicate_of})` : ""}
              </span>
            )}
          </p>
        </div>
      </div>
      <QueueActions id={r.id} picked={!!r.ahmed_pick} skipped={!!r.skipped} needsReview={!!r.needs_review} first={first} last={last} busy={busy} />
    </li>
  );
}
