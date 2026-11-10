"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { str, int, isISODate, errMsg } from "@/lib/action-utils";
import { todayISO } from "@/lib/dates";
import type { ActionState } from "@/lib/types";

const KINDS = ["ordered", "to_send", "sent", "received"];

/** Add (no id) or edit (with id) an entry in "Orders, sent & received". */
export async function saveItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireProfile();
  const id = str(fd, "id");
  const clientId = str(fd, "client_id");
  const kind = str(fd, "kind");
  const description = str(fd, "description");
  const date = str(fd, "item_date");
  const qtyRaw = str(fd, "quantity");
  const quantity = int(fd, "quantity");

  if (!kind || !KINDS.includes(kind)) return { ok: false, error: "Choose what kind of entry this is." };
  if (!description) return { ok: false, error: "Write what it is." };
  if (qtyRaw && (quantity === null || quantity < 0)) return { ok: false, error: "Quantity must be a whole number." };
  if (date && !isISODate(date)) return { ok: false, error: "Invalid date." };

  const row = { kind, description, quantity, item_date: date, notes: str(fd, "notes") };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("client_items").update(row).eq("id", id)
    : clientId
      ? await supabase.from("client_items").insert({ ...row, client_id: clientId })
      : { error: { message: "Missing client." } };
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true, message: id ? "Updated." : "Added." };
}

/** One tap: a "To send" entry becomes "Sent", dated today. */
export async function markItemSent(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("client_items").update({ kind: "sent", item_date: todayISO() }).eq("id", id);
  return error ? { ok: false, error: errMsg(error) } : { ok: true };
}

export async function deleteItem(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("client_items").delete().eq("id", id);
  return error ? { ok: false, error: errMsg(error) } : { ok: true };
}
