"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { errMsg } from "@/lib/action-utils";

const TABLES = { note: "notes", photo: "note_photos", client: "clients" } as const;
export type ReviewKind = keyof typeof TABLES;

export async function markReviewed(kind: ReviewKind, id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!(kind in TABLES)) return { ok: false, error: "Invalid item." };
  const supabase = await createClient();
  const { error } = await supabase.from(TABLES[kind]).update({ reviewed_at: new Date().toISOString() }).eq("id", id);
  return error ? { ok: false, error: errMsg(error) } : { ok: true };
}

/** Mark everything added by other people as reviewed. */
export async function markAllReviewed(): Promise<{ ok: boolean; error?: string }> {
  const me = await requireAdmin();
  const supabase = await createClient();
  const now = new Date().toISOString();
  for (const table of Object.values(TABLES)) {
    const { error } = await supabase.from(table).update({ reviewed_at: now }).is("reviewed_at", null).neq("created_by", me.id);
    if (error) return { ok: false, error: errMsg(error) };
  }
  return { ok: true };
}
