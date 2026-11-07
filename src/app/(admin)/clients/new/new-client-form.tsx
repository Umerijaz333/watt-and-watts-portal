"use client";

import { useActionState, useRef } from "react";
import Link from "@/components/link";
import { createClientAction } from "@/app/actions/clients";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form-bits";
import { CLIENT_TYPES, STAGES } from "@/lib/constants";

export function NewClientForm() {
  const [state, action, pending] = useActionState(createClientAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const forceRef = useRef<HTMLInputElement>(null);
  const dup = state?.duplicate;
  return (
    <ActionForm ref={formRef} action={action} pending={pending} className="card space-y-4">
      <input ref={forceRef} type="hidden" name="force" defaultValue="0" />
      <div>
        <label className="label" htmlFor="name">Name *</label>
        <input id="name" name="name" required className="input" autoFocus />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="firm">Firm</label>
          <input id="firm" name="firm" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <input id="city" name="city" className="input" defaultValue="Lahore" />
        </div>
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select id="type" name="type" className="input" defaultValue="architect">
            {CLIENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="stage">Stage</label>
          <select id="stage" name="stage" className="input" defaultValue="first_contact">
            {STAGES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="next_follow_up">Next follow-up</label>
          <input id="next_follow_up" name="next_follow_up" type="date" className="input" />
        </div>
      </div>
      {dup ? (
        <div role="alert" className="space-y-2 rounded-lg border border-tint-strong bg-tint p-3">
          <p className="font-semibold text-navy">Already saved?</p>
          <p className="text-sm">
            <strong>{dup.name}</strong>
            {dup.firm ? ` · ${dup.firm}` : ""}
            {dup.phone ? ` · ${dup.phone}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/clients/${dup.id}`} className="btn-primary py-2 text-sm">Open {dup.name}</Link>
            <button
              type="button"
              className="btn-secondary py-2 text-sm"
              onClick={() => {
                if (forceRef.current) forceRef.current.value = "1";
                formRef.current?.requestSubmit();
              }}
            >
              No, add as a new client
            </button>
          </div>
        </div>
      ) : (
        <FormMessage state={state} />
      )}
      <SubmitButton pendingText="Creating…">Create client</SubmitButton>
    </ActionForm>
  );
}
