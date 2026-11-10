import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Logged-in user's id, read from the verified session token (no database trip),
 * so pages can start their queries without waiting for the profile.
 */
export const getUserId = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return userId;
});

/** Current user's profile, or redirect to /login. Cached per request. */
export const requireProfile = cache(async (): Promise<Profile> => {
  const userId = await getUserId();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, name, role").eq("id", userId).single();
  if (!profile) redirect("/login?error=no-profile");
  return profile as Profile;
});

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/ahmed");
  return profile;
}

export function homeFor(role: string) {
  return role === "simple" ? "/ahmed" : "/";
}
