"use client";

import { useHydrated } from "@/lib/use-hydrated";
import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRefreshOnSuccess } from "@/lib/use-refresh";
import { saveRequirement, deleteRequirement } from "@/app/actions/requirements";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form-bits";
import type { Requirement } from "@/lib/types";

export function Requirements({ clientId, rows }: { clientId: string; rows: Requirement[] }) {
  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-white p-4 text-muted">No requirements yet. Add the first product below.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white">
          {rows.map((r) => <RequirementRow key={r.id} row={r} />)}
        </ul>
      )}
      <AddRequirement clientId={clientId} />
    </div>
  );
}

function RequirementRow({ row }: { row: Requirement }) {
  const ready = useHydrated();
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(saveRequirement, null);
  const [deleting, startDelete] = useTransition();
  const [err, setErr] = useState<string>();
  useRefreshOnSuccess(state, () => setEditing(false));
  const router = useRouter();

  if (editing)
    return (
      <li className="p-3">
        <ActionForm action={action} pending={pending} className="space-y-2">
          <input type="hidden" name="id" value={row.id} />
          <RequirementInputs row={row} />
          <FormMessage state={state} />
          <div className="flex gap-2">
            <SubmitButton className="btn-primary py-1.5 text-sm">Save</SubmitButton>
            <button type="button" disabled={!ready} className="btn-secondary py-1.5 text-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </ActionForm>
      </li>
    );

  return (
    <li className="flex flex-wrap items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{row.product_text}</p>
        {row.notes && <p className="text-sm text-muted">{row.notes}</p>}
        {err && <p role="alert" className="text-sm text-overdue">{err}</p>}
      </div>
      <span className="w-16 text-right font-semibold">{row.quantity ?? "—"}<span className="ml-1 text-xs font-normal text-muted">qty</span></span>
      <div className="flex gap-1">
        <button type="button" disabled={!ready} className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setEditing(true)}>Edit</button>
        <button
          type="button"
          disabled={deleting || !ready}
          className="btn-danger px-3 py-1.5 text-sm"
          onClick={() => {
            if (!confirm(`Delete "${row.product_text}"?`)) return;
            setErr(undefined);
            startDelete(async () => {
              const res = await deleteRequirement(row.id);
              if (!res.ok) setErr(res.error);
              else router.refresh();
            });
          }}
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}

function RequirementInputs({ row }: { row?: Requirement }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_6rem_1fr]">
      <input name="product_text" required placeholder="Product" defaultValue={row?.product_text ?? ""} className="input" aria-label="Product" />
      <input name="quantity" type="number" min={0} inputMode="numeric" placeholder="Qty" defaultValue={row?.quantity ?? ""} className="input" aria-label="Quantity" />
      <input name="notes" placeholder="Notes" defaultValue={row?.notes ?? ""} className="input" aria-label="Notes" />
    </div>
  );
}

function AddRequirement({ clientId }: { clientId: string }) {
  const ready = useHydrated();
  const [state, action, pending] = useActionState(saveRequirement, null);
  const formRef = useRef<HTMLFormElement>(null);
  useRefreshOnSuccess(state, () => formRef.current?.reset());
  return (
    <ActionForm ref={formRef} action={action} pending={pending} className="card space-y-2">
      <input type="hidden" name="client_id" value={clientId} />
      <RequirementInputs />
      <FormMessage state={state} />
      <SubmitButton className="btn-secondary" pendingText="Adding…">+ Add requirement</SubmitButton>
    </ActionForm>
  );
}
