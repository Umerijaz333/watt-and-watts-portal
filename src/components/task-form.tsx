"use client";
import { useRefreshOnSuccess } from "@/lib/use-refresh";

import { useActionState, useRef } from "react";
import { createTask } from "@/app/actions/tasks";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import type { Profile } from "@/lib/types";

export function TaskForm({
  profiles,
  clients,
  currentUserId,
  simple = false,
}: {
  profiles: Profile[];
  clients: { id: string; name: string; firm: string | null }[];
  currentUserId: string;
  simple?: boolean;
}) {
  const [state, action] = useActionState(createTask, null);
  const formRef = useRef<HTMLFormElement>(null);
  useRefreshOnSuccess(state, () => formRef.current?.reset());

  const lbl = simple ? "mb-1 block text-xl font-semibold" : "label";
  const inp = `input ${simple ? "py-4 text-xl" : ""}`;

  return (
    <form ref={formRef} action={action} className={`card space-y-3 ${simple ? "text-xl" : ""}`}>
      <div>
        <label className={lbl} htmlFor="task-title">Task *</label>
        <input id="task-title" name="title" required className={inp} />
      </div>
      {!simple && (
        <div>
          <label className={lbl} htmlFor="task-desc">Description</label>
          <textarea id="task-desc" name="description" rows={2} className={inp} />
        </div>
      )}
      <div className={simple ? "space-y-3" : "grid gap-3 sm:grid-cols-3"}>
        {!simple && (
          <div>
            <label className={lbl} htmlFor="task-owner">Owner</label>
            <select id="task-owner" name="owner" defaultValue={currentUserId} className={inp}>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className={lbl} htmlFor="task-due">Due date</label>
          <input id="task-due" name="due_date" type="date" className={inp} />
        </div>
        <div>
          <label className={lbl} htmlFor="task-client">Client (optional)</label>
          <select id="task-client" name="client_id" defaultValue="" className={inp}>
            <option value="">— None —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.firm ? ` (${c.firm})` : ""}</option>)}
          </select>
        </div>
      </div>
      <FormMessage state={state} large={simple} />
      <SubmitButton className={`btn-primary ${simple ? "w-full py-5 text-2xl" : ""}`} pendingText="Adding…">
        {simple ? "Save task" : "+ Add task"}
      </SubmitButton>
    </form>
  );
}
