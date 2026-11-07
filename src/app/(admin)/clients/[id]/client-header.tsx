"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { updateClientAction, updateClientField } from "@/app/actions/clients";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { CLIENT_TYPES, STAGES, typeLabel } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/dates";
import type { Client } from "@/lib/types";

export function ClientHeader({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateClientAction, null);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  return (
    <div className="card space-y-4">
      {editing ? (
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={client.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="name" label="Name *" value={client.name} required />
            <Field name="firm" label="Firm" value={client.firm} />
            <Field name="phone" label="Phone" value={client.phone} type="tel" />
            <Field name="email" label="Email" value={client.email} type="email" />
            <Field name="city" label="City" value={client.city} />
            <div>
              <label className="label" htmlFor="type">Type</label>
              <select id="type" name="type" defaultValue={client.type ?? "architect"} className="input">
                {CLIENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <FormMessage state={state} />
          <div className="flex gap-2">
            <SubmitButton>Save</SubmitButton>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-muted">
              {[client.firm, typeLabel(client.type), client.city].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {client.phone ? (
                <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className="btn-primary py-2">
                  📞 {client.phone}
                </a>
              ) : (
                <span className="text-sm text-muted">No phone saved</span>
              )}
              {client.email && <a href={`mailto:${client.email}`} className="btn-secondary py-2">{client.email}</a>}
            </div>
          </div>
          <button type="button" className="btn-secondary py-1.5 text-sm" onClick={() => setEditing(true)}>Edit details</button>
        </div>
      )}

      <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
        <AutoSave clientId={client.id} field="stage" initial={client.stage ?? "first_contact"} label="Stage">
          {(value, onChange, disabled) => (
            <select id="stage" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="input">
              {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          )}
        </AutoSave>
        <AutoSave clientId={client.id} field="next_follow_up" initial={client.next_follow_up ?? ""} label="Next follow-up">
          {(value, onChange, disabled) => (
            <input id="next_follow_up" type="date" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="input" />
          )}
        </AutoSave>
      </div>
    </div>
  );
}

function Field({ name, label, value, type = "text", required }: { name: string; label: string; value: string | null; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={value ?? ""} required={required} className="input" />
    </div>
  );
}

function AutoSave({
  clientId,
  field,
  initial,
  label,
  children,
}: {
  clientId: string;
  field: "stage" | "next_follow_up";
  initial: string;
  label: string;
  children: (value: string, onChange: (v: string) => void, disabled: boolean) => React.ReactNode;
}) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string }>();
  useEffect(() => setValue(initial), [initial]);

  const onChange = (v: string) => {
    const prev = value;
    setValue(v);
    setStatus(undefined);
    start(async () => {
      const res = await updateClientField(clientId, field, v);
      if (res.ok) setStatus({ ok: true, text: "Saved" });
      else {
        setValue(prev);
        setStatus({ ok: false, text: res.error ?? "Could not save" });
      }
    });
  };

  const today = todayISO();
  const hint =
    field === "next_follow_up" && value
      ? value < today
        ? { cls: "text-red-700", text: `Overdue (${formatDate(value)})` }
        : value === today
          ? { cls: "text-amber-700", text: "Due today" }
          : null
      : null;

  return (
    <div>
      <label className="label" htmlFor={field}>{label}</label>
      {children(value, onChange, pending)}
      <p className="mt-1 h-5 text-sm">
        {pending ? (
          <span className="text-muted">Saving…</span>
        ) : status ? (
          <span role={status.ok ? "status" : "alert"} className={status.ok ? "text-green-700" : "text-red-700"}>{status.text}</span>
        ) : hint ? (
          <span className={`font-semibold ${hint.cls}`}>{hint.text}</span>
        ) : null}
      </p>
    </div>
  );
}
