import { formatDate } from "@/lib/dates";

/** "This week: 1 of 2 meetings done" with a simple progress bar. */
export function WeekProgress({ done, target, planned, start, end }: { done: number; target: number; planned: number; start: string; end: string }) {
  const pct = Math.min(100, Math.round((done / target) * 100));
  const met = done >= target;
  return (
    <div className="rounded-3xl bg-navy p-5 text-paper shadow-soft">
      <p className="text-sm text-paper/80">Week of {formatDate(start)} – {formatDate(end)}</p>
      <p className="font-display text-xl font-semibold">
        This week: {done} of {target} meetings done{met ? " ✓" : ""}
      </p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={done} aria-label="Meetings done this week">
        <div className={`h-full rounded-full ${met ? "bg-[#5fbf8f]" : "bg-white"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm text-paper/80">{planned} planned{met ? " · target reached" : ""}</p>
    </div>
  );
}
