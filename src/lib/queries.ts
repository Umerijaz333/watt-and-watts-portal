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
  const { data } = await supabase.from("clients").select("id, name, firm, stage").order("name");
  const rows = data ?? [];
  const contacted = rows.filter((r) => r.stage !== "not_contacted");
  const rest = rows.filter((r) => r.stage === "not_contacted");
  return [...contacted, ...rest].map(({ id, name, firm }) => ({ id, name, firm }));
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

/** Due/overdue clients together with each one's latest real note, in a single request. */
export async function getDueClientsWithLastNote(today: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, firm, stage, next_follow_up, phone, notes(body, created_at, author:profiles(name))")
    .lte("next_follow_up", today)
    .not("notes.body", "like", "Follow-up moved to %")
    .order("next_follow_up", { ascending: true })
    .order("name")
    .order("created_at", { referencedTable: "notes", ascending: false })
    .limit(1, { referencedTable: "notes" });
  if (error) throw error;
  return (data ?? []).map(({ notes, ...c }) => {
    const n = (notes as { body: string; created_at: string; author: Named }[] | null)?.[0];
    return { ...c, lastNote: n ? { body: n.body, created_at: n.created_at, author: nameOf(n.author) } : undefined };
  });
}

/** Most recent note per client, for "last time we spoke" summaries. */
export async function getLastNotes(clientIds: string[]) {
  const map = new Map<string, { body: string; created_at: string; author: string }>();
  if (!clientIds.length) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("client_id, body, created_at, author:profiles(name)")
    .in("client_id", clientIds)
    .not("body", "like", "Follow-up moved to %")
    .order("created_at", { ascending: false })
    .limit(500);
  for (const n of data ?? []) {
    if (!map.has(n.client_id)) map.set(n.client_id, { body: n.body, created_at: n.created_at, author: nameOf(n.author as Named) });
  }
  return map;
}

export type InboxItem = {
  kind: "note" | "photo" | "client";
  id: string;
  created_at: string;
  author: string;
  client: { id: string; name: string } | null;
  text: string;
};

/**
 * Notes, photos and new clients added by other people that have not been reviewed yet.
 * Returns `missingColumn: true` if the review-inbox migration has not been run.
 */
export async function getInbox(meId: string): Promise<{ items: InboxItem[]; missingColumn: boolean; error?: string }> {
  const supabase = await createClient();
  const one = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] : v) ?? null;
  const [notes, photos, clients] = await Promise.all([
    supabase
      .from("notes")
      .select("id, body, created_at, author:profiles(name), client:clients(id, name)")
      .is("reviewed_at", null)
      .neq("created_by", meId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("note_photos")
      .select("id, caption, created_at, author:profiles(name), client:clients(id, name)")
      .is("reviewed_at", null)
      .neq("created_by", meId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("clients")
      .select("id, name, firm, phone, created_at, author:profiles(name)")
      .is("reviewed_at", null)
      .neq("created_by", meId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const err = notes.error ?? photos.error ?? clients.error;
  if (err) return { items: [], missingColumn: err.code === "42703" || /reviewed_at/.test(err.message), error: err.message };

  const items: InboxItem[] = [
    ...(notes.data ?? []).map((n) => ({
      kind: "note" as const, id: n.id, created_at: n.created_at, author: nameOf(n.author as Named),
      client: one(n.client as unknown as { id: string; name: string } | null), text: n.body,
    })),
    ...(photos.data ?? []).map((p) => ({
      kind: "photo" as const, id: p.id, created_at: p.created_at, author: nameOf(p.author as Named),
      client: one(p.client as unknown as { id: string; name: string } | null), text: p.caption ? `Photo: ${p.caption}` : "Photo of notes",
    })),
    ...(clients.data ?? []).map((c) => ({
      kind: "client" as const, id: c.id, created_at: c.created_at, author: nameOf(c.author as Named),
      client: { id: c.id, name: c.name }, text: `New client${c.firm ? ` · ${c.firm}` : ""}${c.phone ? ` · ${c.phone}` : ""}`,
    })),
  ];
  items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { items, missingColumn: false };
}

/** Entries for "Orders, sent & received". `missingTable` if the migration has not been run. */
export async function getClientItems(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_items")
    .select("id, client_id, kind, description, quantity, item_date, notes, created_at, author:profiles(name)")
    .eq("client_id", clientId)
    .order("item_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error)
    return {
      items: [] as import("@/lib/types").ClientItem[],
      missingTable: error.code === "42P01" || error.code === "PGRST205" || /client_items/.test(error.message),
      error: error.message,
    };
  const items = (data ?? []).map((r) => ({ ...r, author: Array.isArray(r.author) ? r.author[0] ?? null : r.author })) as import("@/lib/types").ClientItem[];
  return { items, missingTable: false as boolean, error: undefined as string | undefined };
}
