import Link from "@/components/link";
import { telHref } from "@/lib/phone";
import { mapsHref } from "@/lib/outreach";
import type { Client } from "@/lib/types";

type Colleague = { id: string; name: string; designation: string | null; mobile: string | null; landline: string | null; phone: string | null };

/** Directory details for an imported architect: address, phones, also-at-this-firm, review flags. */
export function DirectoryCard({ c, colleagues, raw }: { c: Client; colleagues: Colleague[]; raw: string | null }) {
  if (!c.source_id && !c.designation && !c.address && !colleagues.length) return null;
  return (
    <section className="card space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-navy">From the directory</h2>
          <p className="text-sm text-muted">
            {[c.designation, c.area, c.tier ? `Tier ${c.tier}` : null, c.suggested_rank ? `#${c.suggested_rank} in suggested order` : null, c.source_id].filter(Boolean).join(" · ")}
            {c.ahmed_pick ? " · ★ Ahmed's pick" : ""}
            {c.skipped ? " · Skipped" : ""}
          </p>
        </div>
        {c.stage === "not_contacted" && !c.skipped && <Link href={`/plan?client=${c.id}`} className="btn-primary">Plan meeting</Link>}
      </div>

      {c.needs_review && (
        <p className="rounded-xl bg-overdue-tint p-3 text-sm text-overdue">
          <strong>Please check:</strong> {c.review_flags?.replace(/_/g, " ")}
          {c.duplicate_of ? ` · may be the same person as ${c.duplicate_of}` : ""}. This row came from automatic reading of Ahmed&apos;s PDF.
          Fix it with “Edit details” above, then use “Mark checked” in the queue.
        </p>
      )}

      <dl className="grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">Address</dt>
          <dd>
            {c.address ?? "—"}
            {c.address && <> · <a href={mapsHref(c.address)} target="_blank" rel="noreferrer" className="font-semibold text-link">Map</a></>}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">Mobile</dt>
          <dd>{c.mobile ? <a href={telHref(c.mobile)} className="font-semibold text-link">{c.mobile}</a> : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">Landline</dt>
          <dd>{c.landline ? <a href={telHref(c.landline)} className="font-semibold text-link">{c.landline}</a> : "—"}</dd>
        </div>
      </dl>

      {colleagues.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Also at this firm ({colleagues.length})</h3>
          <ul className="mt-1 space-y-1">
            {colleagues.map((p) => (
              <li key={p.id}>
                <Link href={`/clients/${p.id}`} className="font-semibold text-navy hover:underline">{p.name}</Link>
                {p.designation ? `, ${p.designation}` : ""}
                {(p.mobile || p.landline || p.phone) && <> · <a href={telHref((p.mobile || p.landline || p.phone)!)} className="text-link">{p.mobile || p.landline || p.phone}</a></>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {raw && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-muted">Original text from Ahmed&apos;s PDF</summary>
          <p className="mt-1 rounded-xl bg-paper p-3 font-mono text-xs">{raw}</p>
        </details>
      )}
    </section>
  );
}
