import { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export type TimelineItem =
  | {
      kind: "note";
      id: string;
      created_at: string;
      author: string;
      body: string;
      pending_from_client: string | null;
      next_follow_up: string | null;
    }
  | {
      kind: "photo";
      id: string;
      created_at: string;
      author: string;
      caption: string | null;
      url: string | null;
    };

type Named = { name: string } | { name: string }[] | null;
const nameOf = (p: Named) => (Array.isArray(p) ? p[0]?.name : p?.name) ?? "Unknown";

/** Notes and photos for a client, merged newest first. Photos get 1-hour signed URLs. */
export async function getTimeline(clientId: string, limit?: number): Promise<TimelineItem[]> {
  const supabase = await createClient();
  let notesQ = supabase
    .from("notes")
    .select("id, body, pending_from_client, next_follow_up, created_at, author:profiles(name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  let photosQ = supabase
    .from("note_photos")
    .select("id, storage_path, caption, created_at, author:profiles(name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (limit) {
    notesQ = notesQ.limit(limit);
    photosQ = photosQ.limit(limit);
  }
  const [{ data: notes, error: nErr }, { data: photos, error: pErr }] = await Promise.all([notesQ, photosQ]);
  if (nErr) throw nErr;
  if (pErr) throw pErr;

  const paths = (photos ?? []).map((p) => p.storage_path);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600);
    data?.forEach((d) => d.path && d.signedUrl && signed.set(d.path, d.signedUrl));
  }

  const items: TimelineItem[] = [
    ...(notes ?? []).map((n) => ({
      kind: "note" as const,
      id: n.id,
      created_at: n.created_at,
      author: nameOf(n.author as Named),
      body: n.body,
      pending_from_client: n.pending_from_client,
      next_follow_up: n.next_follow_up,
    })),
    ...(photos ?? []).map((p) => ({
      kind: "photo" as const,
      id: p.id,
      created_at: p.created_at,
      author: nameOf(p.author as Named),
      caption: p.caption,
      url: signed.get(p.storage_path) ?? null,
    })),
  ];
  items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return limit ? items.slice(0, limit) : items;
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, name, role").order("role");
  return (data ?? []) as Profile[];
}

export async function getClientOptions(): Promise<{ id: string; name: string; firm: string | null }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("id, name, firm").order("name");
  return data ?? [];
}

/** Clients due today or overdue, oldest first. */
export async function getDueClients(today: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, firm, stage, next_follow_up, phone")
    .lte("next_follow_up", today)
    .order("next_follow_up", { ascending: true })
    .order("name");
  if (error) throw error;
  return data ?? [];
}
