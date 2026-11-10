"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, getUserId } from "@/lib/auth";
import { str, isISODate, errMsg } from "@/lib/action-utils";
import type { ActionState } from "@/lib/types";

/**
 * Add a note. Also moves the client's next_follow_up to the note's date and,
 * when given, overwrites clients.pending_from_client.
 * Set `require_follow_up=1` in the form to make the date mandatory (Ahmed's form).
 * With `meeting_id`, the note completes that meeting: the follow-up date is required,
 * the meeting becomes "done" and the client moves to "meeting_done" (never backwards).
 */
export async function addNote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await getUserId(); // logged in? (checked from the session token, no database trip)
  const clientId = str(fd, "client_id");
  const body = str(fd, "body");
  const pending = str(fd, "pending_from_client");
  const followUp = str(fd, "next_follow_up");
  const meetingId = str(fd, "meeting_id");
  const requireFollowUp = fd.get("require_follow_up") === "1" || !!meetingId;

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
  const writes = [];
  if (Object.keys(clientPatch).length) writes.push(supabase.from("clients").update(clientPatch).eq("id", clientId));
  if (meetingId) {
    writes.push(
      supabase.from("meetings").update({ status: "done", outcome_note: body, needs_reschedule: false }).eq("id", meetingId),
      // Move forward to "meeting done" only from the early stages.
      supabase.from("clients").update({ stage: "meeting_done" }).eq("id", clientId).in("stage", ["not_contacted", "first_contact"]),
    );
  } else {
    // A note on an imported, not-yet-contacted architect means we are now in touch.
    writes.push(supabase.from("clients").update({ stage: "first_contact" }).eq("id", clientId).eq("stage", "not_contacted"));
  }
  const results = await Promise.all(writes);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: `Note saved, but the client or meeting was not updated: ${errMsg(failed.error)}` };

  return { ok: true, message: "Note saved." };
}

/** Edit a note's own fields. Does not touch the client record. */
export async function updateNote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await getUserId(); // logged in? (checked from the session token, no database trip)
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
