import Link from "next/link";
import { getClientOptions } from "@/lib/queries";
import { AhmedPhotoForm } from "./photo-form";

export default async function AhmedPhotoPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const clients = await getClientOptions();
  return (
    <div className="space-y-4">
      <Link href="/ahmed" className="text-lg font-semibold text-brand">← Home</Link>
      <h1 className="text-3xl font-bold">Add photo of notes</h1>
      <AhmedPhotoForm clients={clients} initialClientId={clients.some((c) => c.id === client) ? client! : null} />
    </div>
  );
}
