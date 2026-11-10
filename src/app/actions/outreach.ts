"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getUserId } from "@/lib/auth";
import { errMsg, isISODate } from "@/lib/action-utils";
import type { ActionState } from "@/lib/types";

type Result = { ok: boolean; error?: string };

/** Ahmed's pick on/off. A new pick goes to the end of his list. */
export async function togglePick(clientId: string, on: boolean): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  let order: number | null = null;
  if (on) {
    const { data } = await supabase
      .from("clients")
      .select("ahmed_pick_order")
      .eq("ahmed_pick", true)
      .order("ahmed_pick_order", { ascending: false, nullsFirst: false })
      .limit(1);
    order = ((data?.[0]?.ahmed_pick_order as number | null) ?? 0) + 1;
  }
  const { error } = await supabase.from("clients").update({ ahmed_pick: on, ahmed_pick_order: order }).eq("id", clientId);
  return error ? { ok: false, error: errMsg(error) } : { ok: true };
}

/** Move a pick up or down in Ahmed's order (swaps with its neighbour). */
export async function movePick(clientId: string, dir: "up" | "down"): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, ahmed_pick_order")
    .eq("ahmed_pick", true)
    .order("ahmed_pick_order", { ascending: true, nullsFirst: false });
  if (error) return { ok: false, error: errMsg(error) };
  const list = (data ?? []).map((r, i) => ({ id: r.id as string, order: i + 1 }));
  const i = list.findIndex((r) => r.id === clientId);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];
  const results = await Promise.all(
    list.map((r, k) => supabase.from("clients").update({ ahmed_pick_order: k + 1 }).eq("id", r.id)),
  );
  const failed = results.find((r) => r.error);
  return failed?.error ? { ok: false, error: errMsg(failed.error) } : { ok: true };
}

export async function setSkipped(clientId: string, skipped: boolean): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const update = skipped ? { skipped: true, ahmed_pick: false, ahmed_pick_order: null } : { skipped: false };
  const { error } = await supabase.from("clients").update(update).eq("id", clientId);
  return error ? { ok: false, error: errMsg(error) } : { ok: true };
}

/** Clear the "needs review" flag after Umer has checked an imported row. */
export async function clearReviewFlag(clientId: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("clients").update({ needs_review: false }).eq("id", clientId);
  return error ? { ok: false, error: errMsg(error) } : { ok: true };
}

/**
 * Create one or more planned meetings. Form fields repeat per meeting:
 * client_id, scheduled_for, scheduled_time, place, assigned_to.
 */
export async function planMeetings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const ids = fd.getAll("client_id").map(String);
  const dates = fd.getAll("scheduled_for").map(String);
  const times = fd.getAll("scheduled_time").map(String);
  const places = fd.getAll("place").map(String);
  const who = fd.getAll("assigned_to").map(String);
  if (!ids.length) return { ok: false, error: "Choose at least one architect to meet." };
  const rows = [];
  for (let i = 0; i < ids.length; i++) {
    if (!ids[i]) return { ok: false, error: `Meeting ${i + 1}: choose who to meet.` };
    if (!isISODate(dates[i] || null)) return { ok: false, error: `Meeting ${i + 1}: choose a date.` };
    rows.push({
      client_id: ids[i],
      scheduled_for: dates[i],
      scheduled_time: times[i] || null,
      place: places[i]?.trim() || null,
      assigned_to: who[i] || null,
      status: "planned",
    });
  }
  if (new Set(ids).size !== ids.length) return { ok: false, error: "The same architect is chosen twice." };
  const supabase = await createClient();
  const { error } = await supabase.from("meetings").insert(rows);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true, message: rows.length === 1 ? "Meeting planned." : `${rows.length} meetings planned.` };
}

/** New date/time for a meeting; clears Ahmed's "Can't make it" flag. */
export async function rescheduleMeeting(id: string, date: string, time: string): Promise<Result> {
  await requireAdmin();
  if (!isISODate(date)) return { ok: false, error: "Choose a new date." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ scheduled_for: date, scheduled_time: time || null, status: "planned", needs_reschedule: false })
    .eq("id", id);
  return error ? { ok: false, error: errMsg(error) } : { ok: true };
}

export async function skipMeeting(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("meetings").update({ status: "skipped", needs_reschedule: false }).eq("id", id);
  return error ? { ok: false, error: errMsg(error) } : { ok: true };
}

/** Ahmed: "Can't make it". The meeting stops counting and shows up for Umer to reschedule. */
export async function cantMakeIt(id: string): Promise<Result> {
  await getUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ status: "rescheduled", needs_reschedule: true })
    .eq("id", id)
    .eq("status", "planned");
  return error ? { ok: false, error: errMsg(error) } : { ok: true };
}
