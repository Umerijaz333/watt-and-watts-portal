"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { str, int, errMsg } from "@/lib/action-utils";
import type { ActionState } from "@/lib/types";

export async function saveRequirement(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireProfile();
  const id = str(fd, "id");
  const clientId = str(fd, "client_id");
  const product = str(fd, "product_text");
  if (!product) return { ok: false, error: "Product is required." };
  const quantityRaw = str(fd, "quantity");
  const quantity = int(fd, "quantity");
  if (quantityRaw && (quantity === null || quantity < 0)) return { ok: false, error: "Quantity must be a whole number." };
  const row = { product_text: product, quantity, notes: str(fd, "notes") };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("client_requirements").update(row).eq("id", id)
    : clientId
      ? await supabase.from("client_requirements").insert({ ...row, client_id: clientId })
      : { error: { message: "Missing client." } };
  if (error) return { ok: false, error: errMsg(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Updated." : "Added." };
}

export async function deleteRequirement(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("client_requirements").delete().eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  revalidatePath("/", "layout");
  return { ok: true };
}
