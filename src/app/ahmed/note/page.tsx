import Link from "@/components/link";
import { getClientOptions } from "@/lib/queries";
import { AhmedNoteForm } from "./note-form";

export default async function AhmedNotePage({ searchParams }: { searchParams: Promise<{ client?: string; meeting?: string }> }) {
  const { client, meeting } = await searchParams;
  const clients = await getClientOptions();
  return (
    <div className="space-y-4">
      <Link href="/ahmed" className="text-lg font-semibold text-link">← Home</Link>
      <h1 className="font-display text-3xl font-bold text-navy">{meeting ? "How did the meeting go?" : "Add meeting note"}</h1>
      <AhmedNoteForm
        clients={clients}
        initialClientId={clients.some((c) => c.id === client) ? client! : null}
        meetingId={meeting && /^[0-9a-f-]{36}$/i.test(meeting) ? meeting : null}
      />
    </div>
  );
}
