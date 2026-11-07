"use client";
import { useRefreshOnSuccess } from "@/lib/use-refresh";

import { useActionState, useRef } from "react";
import { addNote } from "@/app/actions/notes";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form-bits";

export function AddNoteForm({ clientId }: { clientId: string }) {
  const [state, action, pending] = useActionState(addNote, null);
  const formRef = useRef<HTMLFormElement>(null);
  useRefreshOnSuccess(state, () => formRef.current?.reset());

  return (
    <ActionForm ref={formRef} action={action} pending={pending} className="card space-y-3">
      <input type="hidden" name="client_id" value={clientId} />
      <div>
        <label className="label" htmlFor="note-body">What was discussed *</label>
        <textarea id="note-body" name="body" required rows={4} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="note-pending">Pending from client</label>
        <input id="note-pending" name="pending_from_client" className="input" placeholder="Optional — updates the client record" />
      </div>
      <div>
        <label className="label" htmlFor="note-follow">Next follow-up</label>
        <input id="note-follow" name="next_follow_up" type="date" className="input" />
        <p className="mt-1 text-xs text-muted">Sets the client&apos;s next follow-up date.</p>
      </div>
      <FormMessage state={state} />
      <SubmitButton>Save note</SubmitButton>
    </ActionForm>
  );
}
