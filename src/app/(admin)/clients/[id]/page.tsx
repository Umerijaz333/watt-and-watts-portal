import Link from "@/components/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTimeline, getLastNotes } from "@/lib/queries";
import { LastSpoke } from "@/components/last-spoke";
import { Timeline } from "@/components/timeline";
import { ClientHeader } from "./client-header";
import { ClientDetailsForm } from "./client-details-form";
import { Requirements } from "./requirements";
import { AddNoteForm } from "./add-note-form";
import { PhotoUpload } from "@/components/photo-upload";
import type { Client, Requirement } from "@/lib/types";

export default async function ClientProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: client, error }, { data: reqs }, timeline, last] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("client_requirements").select("*").eq("client_id", id).order("created_at"),
    getTimeline(id),
    getLastNotes([id]),
  ]);
  if (error) throw error;
  if (!client) notFound();
  const c = client as Client;

  return (
    <div className="space-y-6">
      <Link href="/clients" className="text-sm font-semibold text-link">← Clients</Link>
      <ClientHeader client={c} />
      <LastSpoke note={last.get(c.id)} pending={c.pending_from_client} />

      <section>
        <h2 className="mb-2 text-lg font-bold">Conversation status</h2>
        <ClientDetailsForm client={c} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Requirements</h2>
        <Requirements clientId={c.id} rows={(reqs ?? []) as Requirement[]} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-bold">Add note</h2>
          <AddNoteForm clientId={c.id} />
        </div>
        <div>
          <h2 className="mb-2 text-lg font-bold">Add photo</h2>
          <div className="card">
            <PhotoUpload clientId={c.id} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">History <span className="text-muted">({timeline.length})</span></h2>
        <Timeline items={timeline} editable />
      </section>
    </div>
  );
}
