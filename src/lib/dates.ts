export const TZ = "Asia/Karachi";

/** Today's date in Asia/Karachi as YYYY-MM-DD. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-07" -> "07 Nov 2026". Date-only values are not timezone-shifted. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  const mi = Number(m) - 1;
  if (!y || Number.isNaN(mi) || !d) return iso;
  return `${d} ${MONTHS[mi]} ${y}`;
}

/** Timestamp -> "07 Nov 2026, 3:45 pm" in Asia/Karachi. */
export function formatDateTime(ts: string | null | undefined): string {
  if (!ts) return "—";
  const date = new Date(ts);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")} ${get("dayPeriod").toLowerCase()}`;
}

/** Days between today (Karachi) and the given date; negative = overdue. */
export function daysFromToday(iso: string): number {
  const t = Date.parse(todayISO() + "T00:00:00Z");
  const d = Date.parse(iso.slice(0, 10) + "T00:00:00Z");
  return Math.round((d - t) / 86400000);
}

/** Friendly relative wording for a follow-up date: "Today", "Yesterday", "3 days late", "In 2 days". */
export function relativeDay(iso: string): string {
  const d = daysFromToday(iso);
  if (d === 0) return "Today";
  if (d === -1) return "1 day late";
  if (d < 0) return `${-d} days late`;
  if (d === 1) return "Tomorrow";
  return `In ${d} days`;
}

/** "4 Nov" style short date for timestamps, in Asia/Karachi. */
export function shortDate(ts: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short" }).format(new Date(ts));
}

/** "Good morning" / "Good afternoon" / "Good evening" by the time in Asia/Karachi. */
export function greeting(): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hour12: false }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** "Tuesday, 10 Nov" for today in Asia/Karachi. */
export function todayLong(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "short" }).format(new Date());
}
