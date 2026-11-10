"use client";
import { useRefreshOnSuccess } from "@/lib/use-refresh";

import { useActionState } from "react";
import { updateClientAction } from "@/app/actions/clients";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form-bits";
import type { Client } from "@/lib/types";

const FIELDS = [
  { name: "discussed_summary", label: "What we have discussed" },
  { name: "next_to_discuss", label: "What to talk about next" },
  { name: "pending_from_client", label: "Waiting on them for" },
  { name: "pending_from_us", label: "They are waiting on us for" },
] as const;

export function ClientDetailsForm({ client }: { client: Client }) {
  const [state, action, pending] = useActionState(updateClientAction, null);
  useRefreshOnSuccess(state);
  return (
    <ActionForm action={action} pending={pending} className="card space-y-3">
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
    </ActionForm>
  );
}
