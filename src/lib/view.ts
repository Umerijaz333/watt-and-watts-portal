import type { Profile } from "@/lib/types";

/** Per-device choice between Ahmed's simple screens and the full admin view. */
export const VIEW_COOKIE = "ww_view";

/** Simple view if the device chose it, else by default for Ahmed / simple-role users. */
export function prefersSimple(profile: Profile, cookie: string | undefined): boolean {
  if (cookie === "simple") return true;
  if (cookie === "full") return false;
  return profile.role === "simple" || profile.name.trim().toLowerCase() === "ahmed";
}
