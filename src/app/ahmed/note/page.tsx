import Link from "@/components/link";
import { getClientOptions } from "@/lib/queries";
import { AhmedNoteForm } from "./note-form";

export default async function AhmedNotePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const clients = await getClientOptions();
  return (
    <div className="space-y-4">
      <Link href="/ahmed" className="text-lg font-semibold text-link">← Home</Link>
      <h1 className="text-3xl font-bold">Add meeting note</h1>
      <AhmedNoteForm clients={clients} initialClientId={clients.some((c) => c.id === client) ? client! : null} />
    </div>
  );
}
