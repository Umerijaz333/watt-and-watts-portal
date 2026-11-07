import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Current user's profile, or redirect to /login. Cached per request. */
export const requireProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
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
