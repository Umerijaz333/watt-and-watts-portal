"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { VIEW_COOKIE, prefersSimple } from "@/lib/view";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/action-utils";
import type { ActionState } from "@/lib/types";

/**
 * Password login on the server, so phones never download the Supabase library
 * just to sign in. Sets the session cookie and goes straight to
 * the user's home screen.
 */
export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email");
  const password = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  if (!email || !password) return { ok: false, error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message === "Invalid login credentials" ? "Wrong email or password." : error?.message ?? "Could not sign in.",
    };
  }
  const { data: profile } = await supabase.from("profiles").select("id, name, role").eq("id", data.user.id).maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, error: "Signed in, but no profile was found for this account. Ask Umer to set it up." };
  }
  // Go straight to the right home screen (no detour through the dashboard),
  // and remember Ahmed's simple view on this device.
  const jar = await cookies();
  const view = jar.get(VIEW_COOKIE)?.value;
  if (prefersSimple(profile as Profile, view)) {
    if (!view) jar.set(VIEW_COOKIE, "simple", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true });
    redirect("/ahmed");
  }
  redirect("/");
}
