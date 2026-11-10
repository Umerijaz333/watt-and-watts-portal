"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { errMsg } from "@/lib/action-utils";

/** Called after the browser has uploaded the file to Storage. */
export async function recordPhoto(
  clientId: string,
  storagePath: string,
  caption: string,
): Promise<{ ok: boolean; error?: string }> {
  await getUserId(); // logged in? (checked from the session token, no database trip)
  if (!clientId || !storagePath) return { ok: false, error: "Missing client or file." };
  if (!storagePath.startsWith(`${clientId}/`)) return { ok: false, error: "Invalid file path." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("note_photos")
    .insert({ client_id: clientId, storage_path: storagePath, caption: caption.trim() || null });
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}
