"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { str, isISODate, errMsg } from "@/lib/action-utils";
import type { ActionState } from "@/lib/types";

/**
 * Add a note. Also moves the client's next_follow_up to the note's date and,
 * when given, overwrites clients.pending_from_client.
 * Set `require_follow_up=1` in the form to make the date mandatory (Ahmed's form).
 */
export async function addNote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireProfile();
  const clientId = str(fd, "client_id");
  const body = str(fd, "body");
  const pending = str(fd, "pending_from_client");
  const followUp = str(fd, "next_follow_up");
  const requireFollowUp = fd.get("require_follow_up") === "1";

  if (!clientId) return { ok: false, error: "Please choose a client." };
  if (!body) return { ok: false, error: "Please write what was discussed." };
  if (requireFollowUp && !followUp) return { ok: false, error: "Please choose the next follow-up date." };
  if (followUp && !isISODate(followUp)) return { ok: false, error: "Invalid follow-up date." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .insert({ client_id: clientId, body, pending_from_client: pending, next_follow_up: followUp });
  if (error) return { ok: false, error: errMsg(error) };

  const clientPatch: Record<string, string> = {};
  if (followUp) clientPatch.next_follow_up = followUp;
  if (pending) clientPatch.pending_from_client = pending;
  if (Object.keys(clientPatch).length) {
    const { error: upErr } = await supabase.from("clients").update(clientPatch).eq("id", clientId);
    if (upErr) return { ok: false, error: `Note saved, but the client's follow-up was not updated: ${errMsg(upErr)}` };
  }

  return { ok: true, message: "Note saved." };
}

/** Edit a note's own fields. Does not touch the client record. */
export async function updateNote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireProfile();
  const id = str(fd, "id");
  const body = str(fd, "body");
  const followUp = str(fd, "next_follow_up");
  if (!id) return { ok: false, error: "Missing note id." };
  if (!body) return { ok: false, error: "Note cannot be empty." };
  if (followUp && !isISODate(followUp)) return { ok: false, error: "Invalid date." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .update({ body, pending_from_client: str(fd, "pending_from_client"), next_follow_up: followUp })
    .eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true, message: "Note updated." };
}

export async function deleteNote(id: string): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { ok: false, error: "Only admin can delete notes." };
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}
