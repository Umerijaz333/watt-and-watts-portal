"use client";

import { useActionState, useState } from "react";
import { addNote } from "@/app/actions/notes";
import { ClientPicker, type ClientOption } from "@/components/client-picker";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form-bits";
import { DoneScreen } from "../done-screen";
import { formatDate, todayISO } from "@/lib/dates";
import { QUICK_DATES, plusDays } from "@/lib/date-options";

export function AhmedNoteForm({ clients, initialClientId }: { clients: ClientOption[]; initialClientId: string | null }) {
  const [state, action, pending] = useActionState(addNote, null);
  const [clientId, setClientId] = useState<string | null>(initialClientId);
  const [date, setDate] = useState("");
  const [clientError, setClientError] = useState<string>();

  if (state?.ok)
    return (
      <DoneScreen
        title="Note saved"
        detail={date ? `Next follow-up: ${formatDate(date)}` : undefined}
        again={{ href: "/ahmed/note", label: "Add another note" }}
      />
    );

  return (
    <ActionForm
      action={action} pending={pending}
      onSubmit={(e) => {
        if (!clientId) {
          e.preventDefault();
          setClientError("Please choose a client first.");
        }
      }}
      className="space-y-6"
    >
      <input type="hidden" name="require_follow_up" value="1" />

      <fieldset>
        <legend className="mb-2 text-xl font-bold">1. Client</legend>
        <ClientPicker clients={clients} value={clientId} onChange={(id) => { setClientId(id); setClientError(undefined); }} />
        {clientError && <p role="alert" className="mt-2 rounded-lg bg-overdue-tint p-3 text-xl font-medium text-overdue">{clientError}</p>}
      </fieldset>

      <div>
        <label htmlFor="body" className="mb-2 block text-xl font-bold">2. What was discussed</label>
        <textarea id="body" name="body" required rows={5} className="input py-3 text-xl" />
      </div>

      <div>
        <label htmlFor="pending" className="mb-2 block text-xl font-bold">3. Pending from the client</label>
        <textarea id="pending" name="pending_from_client" rows={2} className="input py-3 text-xl" placeholder="e.g. drawings, approval, payment" />
      </div>

      <div>
        <label htmlFor="follow" className="mb-2 block text-xl font-bold">4. Next follow-up date *</label>
        <div className="mb-3 grid grid-cols-2 gap-2 min-[400px]:grid-cols-3">
          {QUICK_DATES.map((q) => {
            const v = plusDays(q.days);
            return (
              <button
                key={q.label}
                type="button"
                onClick={() => setDate(v)}
                aria-pressed={date === v}
                className={`rounded-xl border-2 py-4 text-xl font-semibold ${date === v ? "border-link bg-tint text-navy" : "border-gray-400 bg-white"}`}
              >
                {q.label}
              </button>
            );
          })}
        </div>
        <label htmlFor="follow" className="mb-1 block text-lg">Or pick another date:</label>
        <input id="follow" name="next_follow_up" type="date" required min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className="input py-4 text-xl" />
        {date && <p className="mt-2 rounded-lg bg-tint p-2 text-xl font-semibold text-navy">Follow-up: {formatDate(date)}</p>}
      </div>

      <FormMessage state={state} large />
      <SubmitButton className="btn-primary w-full py-5 text-2xl">Save note</SubmitButton>
    </ActionForm>
  );
}
