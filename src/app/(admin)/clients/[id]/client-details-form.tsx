"use client";

import { useActionState } from "react";
import { updateClientAction } from "@/app/actions/clients";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import type { Client } from "@/lib/types";

const FIELDS = [
  { name: "discussed_summary", label: "Discussed so far" },
  { name: "next_to_discuss", label: "Next to discuss" },
  { name: "pending_from_client", label: "Pending from client" },
  { name: "pending_from_us", label: "Pending from us" },
] as const;

export function ClientDetailsForm({ client }: { client: Client }) {
  const [state, action] = useActionState(updateClientAction, null);
  return (
    <form action={action} className="card space-y-3">
      <input type="hidden" name="id" value={client.id} />
      {/* key refreshes defaults after server revalidation (e.g. a note updated pending_from_client) */}
      <div key={client.updated_at} className="grid gap-3 md:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.name}>
            <label className="label" htmlFor={f.name}>{f.label}</label>
            <textarea id={f.name} name={f.name} rows={3} defaultValue={client[f.name] ?? ""} className="input" />
          </div>
        ))}
      </div>
      <FormMessage state={state} />
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
