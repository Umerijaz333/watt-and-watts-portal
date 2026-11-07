import Link from "@/components/link";
import { NewClientForm } from "./new-client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/clients" className="text-sm font-semibold text-link">← Clients</Link>
      <h1 className="text-2xl font-bold">Add client</h1>
      <NewClientForm />
    </div>
  );
}
