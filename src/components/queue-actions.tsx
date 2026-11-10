"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/link";
import { togglePick, movePick, setSkipped, clearReviewFlag } from "@/app/actions/outreach";
import { useHydrated } from "@/lib/use-hydrated";

/** Row actions in the queue: Ahmed's pick (+ reorder), Skip, Plan meeting, Mark checked. */
export function QueueActions({
  id,
  picked,
  skipped,
  needsReview,
  first,
  last,
  busy,
}: {
  id: string;
  picked: boolean;
  skipped: boolean;
  needsReview: boolean;
  first: boolean;
  last: boolean;
  busy: boolean;
}) {
  const router = useRouter();
  const ready = useHydrated();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setErr(undefined);
    start(async () => {
      const r = await fn();
      if (r.ok) router.refresh();
      else setErr(r.error ?? "Could not save.");
    });
  };
  const off = !ready || pending;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!skipped && (
        <button
          type="button"
          disabled={off}
          aria-pressed={picked}
          onClick={() => run(() => togglePick(id, !picked))}
          className={`btn px-3 py-1.5 text-sm ${picked ? "bg-navy text-white" : "border-2 border-tint-strong bg-surface text-navy"}`}
        >
          {picked ? "★ Ahmed's pick" : "☆ Ahmed's pick"}
        </button>
      )}
      {picked && !skipped && (
        <>
          <button type="button" disabled={off || first} onClick={() => run(() => movePick(id, "up"))} aria-label="Move pick up" className="btn-secondary px-2.5 py-1.5 text-sm">↑</button>
          <button type="button" disabled={off || last} onClick={() => run(() => movePick(id, "down"))} aria-label="Move pick down" className="btn-secondary px-2.5 py-1.5 text-sm">↓</button>
        </>
      )}
      {!skipped && !busy && (
        <Link href={`/plan?client=${id}`} className="btn-primary px-3 py-1.5 text-sm">Plan meeting</Link>
      )}
      {needsReview && (
        <button type="button" disabled={off} onClick={() => run(() => clearReviewFlag(id))} className="btn-secondary px-3 py-1.5 text-sm">Mark checked</button>
      )}
      <button
        type="button"
        disabled={off}
        onClick={() => run(() => setSkipped(id, !skipped))}
        className={`px-2 py-1.5 text-sm font-semibold ${skipped ? "text-link" : "text-muted"} underline`}
      >
        {skipped ? "Bring back" : "Skip"}
      </button>
      {pending && <span className="text-xs text-muted">Saving…</span>}
      {err && <span role="alert" className="text-xs text-overdue">{err}</span>}
    </div>
  );
}
