import Link from "@/components/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTimeline, getLastNotes, getClientItems } from "@/lib/queries";
import { ClientItems } from "@/components/client-items";
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
  const [{ data: client, error }, { data: reqs }, timeline, last, items] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("client_requirements").select("*").eq("client_id", id).order("created_at"),
    getTimeline(id),
    getLastNotes([id]),
    getClientItems(id),
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
        <h2 className="text-lg font-bold text-navy">Where things stand</h2>
        <p className="mb-3 text-sm text-muted">What you have discussed, what is next, and who is waiting on whom.</p>
        <ClientDetailsForm client={c} />
      </section>

      <section>
        <h2 className="text-lg font-bold text-navy">What they need</h2>
        <p className="mb-3 text-sm text-muted">Products and quantities for this project.</p>
        <Requirements clientId={c.id} rows={(reqs ?? []) as Requirement[]} />
      </section>

      <section>
        <h2 className="text-lg font-bold text-navy">Orders, sent &amp; received</h2>
        <p className="mb-3 text-sm text-muted">What they ordered, what we are sending or have sent, and what came back from them.</p>
        {items.missingTable ? (
          <p role="alert" className="card text-overdue">
            This section needs a one-time database update: run <code>supabase/migrations/20261110000000_client_items.sql</code> in the Supabase SQL Editor.
          </p>
        ) : items.error ? (
          <p role="alert" className="card text-overdue">Could not load this section: {items.error}</p>
        ) : (
          <ClientItems clientId={c.id} items={items.items} />
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold text-navy">Write down a conversation</h2>
          <AddNoteForm clientId={c.id} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold text-navy">Add a photo of notes</h2>
          <div className="card">
            <PhotoUpload clientId={c.id} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-navy">Everything so far <span className="text-muted">({timeline.length})</span></h2>
        <Timeline items={timeline} editable />
      </section>
    </div>
  );
}
