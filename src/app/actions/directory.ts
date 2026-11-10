"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { importRows } from "@/lib/directory-import";
import { errMsg } from "@/lib/action-utils";
import type { ActionState } from "@/lib/types";

/** Import (or re-import) the architect directory CSV chosen in the browser. Admin only. */
export async function importDirectory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose the architect list file (.csv) first." };
  if (file.size > 1.5 * 1024 * 1024) return { ok: false, error: "That file is too big for the architect list (over 1.5 MB)." };
  try {
    const supabase = await createClient();
    const r = await importRows(supabase, await file.text());
    return {
      ok: true,
      message: `Done: ${r.read} rows read, ${r.inserted} added, ${r.updated} already there (kept as they are), ${r.flagged} marked “please check”.`,
    };
  } catch (e) {
    return { ok: false, error: `Import failed: ${errMsg(e)}` };
  }
}
