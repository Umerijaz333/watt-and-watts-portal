"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, getUserId } from "@/lib/auth";
import { str, isISODate, errMsg } from "@/lib/action-utils";
import type { ActionState } from "@/lib/types";

export async function createTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  const title = str(fd, "title");
  const due = str(fd, "due_date");
  if (!title) return { ok: false, error: "Title is required." };
  if (due && !isISODate(due)) return { ok: false, error: "Invalid due date." };
  // Simple users can only create tasks for themselves.
  const owner = profile.role === "simple" ? profile.id : (str(fd, "owner") ?? profile.id);

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    title,
    description: str(fd, "description"),
    owner,
    due_date: due,
    client_id: str(fd, "client_id"),
  });
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true, message: "Task added." };
}

export async function setTaskStatus(id: string, status: string): Promise<{ ok: boolean; error?: string }> {
  await getUserId(); // logged in? (checked from the session token, no database trip)
  if (!["todo", "doing", "done"].includes(status)) return { ok: false, error: "Invalid status." };
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

export async function deleteTask(id: string): Promise<{ ok: boolean; error?: string }> {
  await getUserId(); // logged in? (checked from the session token, no database trip)
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}
