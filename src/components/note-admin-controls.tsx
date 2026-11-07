"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { updateNote, deleteNote } from "@/app/actions/notes";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import type { TimelineItem } from "@/lib/queries";
import { formatDate } from "@/lib/dates";

type Note = Extract<TimelineItem, { kind: "note" }>;

export function NoteAdminControls({ note }: { note: Note }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateNote, null);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();

  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (editing)
    return (
      <form action={action} className="space-y-3">
        <input type="hidden" name="id" value={note.id} />
        <textarea name="body" defaultValue={note.body} required rows={4} className="input" aria-label="Note" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor={`p-${note.id}`}>Pending from client</label>
            <input id={`p-${note.id}`} name="pending_from_client" defaultValue={note.pending_from_client ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor={`f-${note.id}`}>Follow-up date</label>
            <input id={`f-${note.id}`} type="date" name="next_follow_up" defaultValue={note.next_follow_up ?? ""} className="input" />
          </div>
        </div>
        <p className="text-xs text-muted">Editing a note does not change the client&apos;s follow-up date.</p>
        <FormMessage state={state} />
        <div className="flex gap-2">
          <SubmitButton>Save</SubmitButton>
          <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );

  return (
    <div>
      <p className="whitespace-pre-wrap">{note.body}</p>
      {(note.pending_from_client || note.next_follow_up) && (
        <dl className="mt-2 space-y-0.5 text-sm text-muted">
          {note.pending_from_client && (
            <div><dt className="inline font-semibold">Pending from client: </dt><dd className="inline">{note.pending_from_client}</dd></div>
          )}
          {note.next_follow_up && (
            <div><dt className="inline font-semibold">Follow-up: </dt><dd className="inline">{formatDate(note.next_follow_up)}</dd></div>
          )}
        </dl>
      )}
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setEditing(true)}>Edit</button>
        <button
          type="button"
          disabled={deleting}
          className="btn-danger px-3 py-1.5 text-sm"
          onClick={() => {
            if (!confirm("Delete this note? This cannot be undone.")) return;
            setDeleteError(undefined);
            startDelete(async () => {
              const res = await deleteNote(note.id);
              if (!res.ok) setDeleteError(res.error);
            });
          }}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
      {deleteError && <p role="alert" className="mt-2 text-sm text-red-700">{deleteError}</p>}
    </div>
  );
}
