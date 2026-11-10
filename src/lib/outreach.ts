import { createClient } from "@/lib/supabase/server";
import { TZ, todayISO } from "@/lib/dates";
import { plusDays } from "@/lib/date-options";

/** Meetings to hold per week (env WEEKLY_MEETING_TARGET, default 2). */
export const WEEKLY_TARGET = Math.max(1, Number(process.env.WEEKLY_MEETING_TARGET ?? 2) || 2);

/** Ahmed's WhatsApp number, international format, digits only (env AHMED_WHATSAPP). */
export const AHMED_WHATSAPP = (process.env.AHMED_WHATSAPP ?? "").replace(/\D/g, "");

/**
 * The outreach week runs Monday to Saturday in Asia/Karachi.
 * On Sunday the "current" week is the one starting tomorrow.
 */
export function weekRange(today = todayISO()) {
  const dow = new Date(today + "T00:00:00Z").getUTCDay(); // 0 = Sunday
  const start = dow === 0 ? plusDays(1, today) : plusDays(1 - dow, today);
  return { start, end: plusDays(5, start) };
}

/** 0 = Monday … 6 = Sunday, in Asia/Karachi. */
export function karachiWeekday(): number {
  const d = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short" }).format(new Date());
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(d);
}

export type QueueRow = {
  id: string;
  name: string;
  designation: string | null;
  firm: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  mobile: string | null;
  landline: string | null;
  tier: string | null;
  firm_group: string | null;
  suggested_rank: number | null;
  ahmed_pick: boolean | null;
  ahmed_pick_order: number | null;
  skipped: boolean | null;
  needs_review: boolean | null;
  review_flags: string | null;
  duplicate_of: string | null;
};

const QUEUE_COLS =
  "id, name, designation, firm, area, address, phone, mobile, landline, tier, firm_group, suggested_rank, ahmed_pick, ahmed_pick_order, skipped, needs_review, review_flags, duplicate_of";

/** A firm is the unit of outreach; hand-added clients without a firm group count as their own firm. */
export const firmKey = (c: { id: string; firm_group?: string | null }) => c.firm_group || `client:${c.id}`;

/** Queue order: Ahmed's picks first (in his order), then suggested rank, then name. */
export function queueSort(a: QueueRow, b: QueueRow) {
  const pa = a.ahmed_pick ? 0 : 1, pb = b.ahmed_pick ? 0 : 1;
  if (pa !== pb) return pa - pb;
  if (pa === 0) return (a.ahmed_pick_order ?? 1e9) - (b.ahmed_pick_order ?? 1e9);
  return (a.suggested_rank ?? 1e9) - (b.suggested_rank ?? 1e9) || a.name.localeCompare(b.name);
}

/**
 * Not-contacted clients, one row per firm (primary contact), tier C hidden,
 * skipped hidden unless asked for. Sorted in queue order.
 */
export async function getQueue(opts: { includeSkipped?: boolean; includeTierC?: boolean } = {}) {
  const supabase = await createClient();
  let q = supabase.from("clients").select(QUEUE_COLS).eq("stage", "not_contacted").eq("is_firm_primary", true);
  if (!opts.includeTierC) q = q.or("tier.is.null,tier.neq.C");
  if (!opts.includeSkipped) q = q.eq("skipped", false);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as QueueRow[]).sort(queueSort);
}

/** Firms that already have a planned or done meeting (never suggested again). */
export async function getBusyFirms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("client:clients(id, firm_group)")
    .in("status", ["planned", "done"]);
  if (error) throw error;
  const set = new Set<string>();
  for (const m of data ?? []) {
    const c = (Array.isArray(m.client) ? m.client[0] : m.client) as { id: string; firm_group: string | null } | null;
    if (c) set.add(firmKey(c));
  }
  return set;
}

/**
 * "Suggest next 2": walk the queue in order, at most one per firm, skipping firms that already
 * have a planned or done meeting. After the first pick, prefer a second from the same area if one
 * exists within the next 20 candidates, so both visits fit one trip.
 */
export function suggest(queue: QueueRow[], busy: Set<string>, count = 2, start: QueueRow[] = []): QueueRow[] {
  const used = new Set<string>(busy);
  for (const row of start) used.add(firmKey(row));
  const candidates = () => queue.filter((r) => !used.has(firmKey(r)));
  const picks: QueueRow[] = [...start];
  while (picks.length < count) {
    const pool = candidates();
    if (!pool.length) break;
    let next = pool[0];
    const anchor = picks[0];
    if (anchor?.area) {
      const sameArea = pool.slice(0, 20).find((r) => r.area === anchor.area);
      if (sameArea) next = sameArea;
    }
    picks.push(next);
    used.add(firmKey(next));
  }
  return picks;
}

export type WeekMeeting = {
  id: string;
  client_id: string;
  scheduled_for: string;
  scheduled_time: string | null;
  place: string | null;
  status: "planned" | "done" | "skipped" | "rescheduled";
  needs_reschedule: boolean;
  outcome_note: string | null;
  assigned: { name: string } | null;
  client: {
    id: string;
    name: string;
    designation: string | null;
    firm: string | null;
    area: string | null;
    address: string | null;
    phone: string | null;
    mobile: string | null;
    landline: string | null;
  } | null;
};

/**
 * Meetings for the week (Mon–Sat), plus any still-planned meetings from earlier weeks
 * and anything Ahmed flagged with "Can't make it".
 */
export async function getWeekMeetings(range = weekRange()) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select(
      "id, client_id, scheduled_for, scheduled_time, place, status, needs_reschedule, outcome_note, assigned:profiles!meetings_assigned_to_fkey(name), client:clients(id, name, designation, firm, area, address, phone, mobile, landline)",
    )
    .or(
      `and(scheduled_for.gte.${range.start},scheduled_for.lte.${range.end}),and(status.eq.planned,scheduled_for.lt.${range.start}),needs_reschedule.eq.true`,
    )
    .order("scheduled_for")
    .order("scheduled_time", { nullsFirst: false });
  if (error) return { meetings: [] as WeekMeeting[], error: error.message, missingTable: /meetings/.test(error.message) };
  const one = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] ?? null : v);
  const meetings = (data ?? []).map((m) => ({ ...m, assigned: one(m.assigned), client: one(m.client) })) as unknown as WeekMeeting[];
  return { meetings, error: undefined as string | undefined, missingTable: false };
}

/** Done meetings scheduled inside the week count toward the target. */
export function weekProgress(meetings: WeekMeeting[], range = weekRange()) {
  const inWeek = (m: WeekMeeting) => m.scheduled_for >= range.start && m.scheduled_for <= range.end;
  const done = meetings.filter((m) => m.status === "done" && inWeek(m)).length;
  const planned = meetings.filter((m) => m.status === "planned").length;
  return { done, planned, target: WEEKLY_TARGET };
}

/** Best number to call: mobile first, then landline, then the general phone field. */
export const callNumber = (c: { mobile?: string | null; landline?: string | null; phone?: string | null }) =>
  c.mobile || c.landline || c.phone || null;

/** Google Maps search link for an address in Lahore. */
export const mapsHref = (address: string | null | undefined, name?: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address || name || ""}, Lahore`)}`;

/** "Tuesday, 11 Nov 2026, 3:00 pm" for a meeting date and optional time. */
export function meetingWhen(date: string, time?: string | null) {
  const d = new Date(date + "T12:00:00Z");
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(d);
  const [y, m, dd] = date.split("-");
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1];
  let t = "";
  if (time) {
    const [hh, mm] = time.split(":").map(Number);
    t = `, ${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh < 12 ? "am" : "pm"}`;
  }
  return `${day}, ${dd} ${mon} ${y}${t}`;
}

/** The weekly WhatsApp message for Ahmed, in the agreed format. */
export function reminderText(meetings: WeekMeeting[]) {
  const lines = [`Salam Ahmed. This week's meetings (target ${WEEKLY_TARGET}):`];
  meetings.forEach((m, i) => {
    const c = m.client;
    if (!c) return;
    lines.push(`${i + 1}. ${[c.name, c.designation, c.firm].filter(Boolean).join(", ")}`);
    lines.push(`   ${[meetingWhen(m.scheduled_for, m.scheduled_time), c.area].filter(Boolean).join(" | ")}`);
    const contact = [callNumber(c), m.place || c.address].filter(Boolean).join(" | ");
    if (contact) lines.push(`   ${contact}`);
  });
  lines.push("After each meeting please add a note or a photo of your notes in the portal, and tell me the next follow-up date.");
  return lines.join("\n");
}

export const reminderHref = (text: string) => (AHMED_WHATSAPP ? `https://wa.me/${AHMED_WHATSAPP}?text=${encodeURIComponent(text)}` : null);
