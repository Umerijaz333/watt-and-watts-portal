"use client";

import { useActionState } from "react";
import { importDirectory } from "@/app/actions/directory";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form-bits";
import { useRefreshOnSuccess } from "@/lib/use-refresh";

/** Choose the directory CSV and import it straight from the app. */
export function DirectoryImport() {
  const [state, action, pending] = useActionState(importDirectory, null);
  useRefreshOnSuccess(state);
  return (
    <ActionForm action={action} pending={pending} className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-btn/50 bg-tint p-5 text-center text-navy hover:bg-tint-strong">
        <span className="font-semibold">Choose the architect list file</span>
        <span className="text-sm text-muted">lahore_architects_structured.csv</span>
        <input type="file" name="file" accept=".csv,text/csv" required className="mt-2 text-sm" />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Importing… (takes a few seconds)">Import architect list</SubmitButton>
    </ActionForm>
  );
}
