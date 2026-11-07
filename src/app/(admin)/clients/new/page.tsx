import Link from "next/link";
import { NewClientForm } from "./new-client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/clients" className="text-sm font-semibold text-brand">← Clients</Link>
      <h1 className="text-2xl font-bold">Add client</h1>
      <NewClientForm />
    </div>
  );
}
