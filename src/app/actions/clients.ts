"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { str, isISODate, errMsg } from "@/lib/action-utils";
import { STAGES, CLIENT_TYPES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

const stageValues = STAGES.map((s) => s.value) as string[];
const typeValues = CLIENT_TYPES.map((s) => s.value) as string[];

/** Admin "Add client" form. Redirects to the new profile. */
export async function createClientAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireProfile();
  const name = str(fd, "name");
  if (!name) return { ok: false, error: "Name is required." };
  const type = str(fd, "type") ?? "architect";
  const stage = str(fd, "stage") ?? "first_contact";
  const followUp = str(fd, "next_follow_up");
  if (!typeValues.includes(type) || !stageValues.includes(stage)) return { ok: false, error: "Invalid type or stage." };
  if (followUp && !isISODate(followUp)) return { ok: false, error: "Invalid follow-up date." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      firm: str(fd, "firm"),
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      city: str(fd, "city"),
      type,
      stage,
      next_follow_up: followUp,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error ? errMsg(error) : "Could not create client." };
  redirect(`/clients/${data.id}`);
}

/** Quick create from Ahmed's screens: name + phone only. */
export async function quickCreateClient(
  name: string,
  phone: string,
): Promise<{ ok: true; id: string; name: string } | { ok: false; error: string }> {
  await requireProfile();
  const n = name.trim();
  if (!n) return { ok: false, error: "Please enter the client's name." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ name: n, phone: phone.trim() || null })
    .select("id, name")
    .single();
  if (error || !data) return { ok: false, error: error ? errMsg(error) : "Could not create client." };
  return { ok: true, id: data.id, name: data.name };
}

const EDITABLE = [
  "name",
  "firm",
  "phone",
  "email",
  "city",
  "type",
  "stage",
  "discussed_summary",
  "next_to_discuss",
  "pending_from_client",
  "pending_from_us",
  "next_follow_up",
] as const;
type EditableField = (typeof EDITABLE)[number];

/** Generic form-based update: only keys present in the form are written. */
export async function updateClientAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireProfile();
  const id = str(fd, "id");
  if (!id) return { ok: false, error: "Missing client id." };
  const patch: Partial<Record<EditableField, string | null>> = {};
  for (const key of EDITABLE) {
    if (fd.has(key)) patch[key] = str(fd, key);
  }
  if ("name" in patch && !patch.name) return { ok: false, error: "Name cannot be empty." };
  if (patch.stage && !stageValues.includes(patch.stage)) return { ok: false, error: "Invalid stage." };
  if (patch.type && !typeValues.includes(patch.type)) return { ok: false, error: "Invalid type." };
  if (patch.next_follow_up && !isISODate(patch.next_follow_up)) return { ok: false, error: "Invalid date." };

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(patch).eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true, message: "Saved." };
}

/** Single-field update used by auto-saving controls (stage dropdown, follow-up date). */
export async function updateClientField(
  id: string,
  field: "stage" | "next_follow_up",
  value: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireProfile();
  const v = value.trim() || null;
  if (field === "stage" && (!v || !stageValues.includes(v))) return { ok: false, error: "Invalid stage." };
  if (field === "next_follow_up" && v && !isISODate(v)) return { ok: false, error: "Invalid date." };
  const supabase = await createClient();
  const { error } = await supabase.from("clients").update({ [field]: v }).eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}
