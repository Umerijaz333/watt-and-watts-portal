"use client";

import { useActionState } from "react";
import { createClientAction } from "@/app/actions/clients";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { CLIENT_TYPES, STAGES } from "@/lib/constants";

export function NewClientForm() {
  const [state, action] = useActionState(createClientAction, null);
  return (
    <form action={action} className="card space-y-4">
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
      <FormMessage state={state} />
      <SubmitButton pendingText="Creating…">Create client</SubmitButton>
    </form>
  );
}
