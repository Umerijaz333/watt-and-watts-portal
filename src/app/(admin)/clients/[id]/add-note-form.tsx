"use client";

import { useActionState, useEffect, useRef } from "react";
import { addNote } from "@/app/actions/notes";
import { FormMessage, SubmitButton } from "@/components/form-bits";

export function AddNoteForm({ clientId }: { clientId: string }) {
  const [state, action] = useActionState(addNote, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card space-y-3">
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
    </form>
  );
}
