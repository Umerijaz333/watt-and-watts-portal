"use client";

import { useActionState, useState } from "react";
import { planMeetings } from "@/app/actions/outreach";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form-bits";
import { useRefreshOnSuccess } from "@/lib/use-refresh";
import type { Profile } from "@/lib/types";

export type Candidate = { id: string; name: string; designation: string | null; firm: string | null; area: string | null; address: string | null; firmKey: string };

/**
 * Planning form: one card per suggested meeting. Each suggestion can be swapped for the next
 * candidate in queue order (or any candidate from the list), then given a date, time, place
 * and who attends.
 */
export function PlanForm({
  candidates,
  initial,
  profiles,
  defaultAttendee,
  defaultDate,
}: {
  candidates: Candidate[];
  initial: string[];
  profiles: Profile[];
  defaultAttendee: string | null;
  defaultDate: string;
}) {
  const [state, action, pending] = useActionState(planMeetings, null);
  const [slots, setSlots] = useState<string[]>(initial);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  useRefreshOnSuccess(state, () => setSlots([]));

  const firmOf = (id: string) => byId.get(id)?.firmKey;
  const swap = (i: number) => {
    const others = new Set(slots.filter((_, k) => k !== i).map(firmOf));
    const start = candidates.findIndex((c) => c.id === slots[i]);
    const pool = [...candidates.slice(start + 1), ...candidates.slice(0, Math.max(start, 0))];
    const next = pool.find((c) => !others.has(c.firmKey) && c.id !== slots[i]);
    if (next) setSlots((s) => s.map((v, k) => (k === i ? next.id : v)));
  };

  if (state?.ok && slots.length === 0)
    return <p role="status" className="card font-semibold text-done">✓ {state.message} They are listed below and on Ahmed&apos;s phone.</p>;

  if (slots.length === 0) return null;

  return (
    <ActionForm action={action} pending={pending} className="space-y-3">
      {slots.map((id, i) => {
        const c = byId.get(id);
        return (
          <fieldset key={i} className="card space-y-3">
            <legend className="sr-only">Meeting {i + 1}</legend>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Meeting {i + 1}</p>
                <p className="font-display text-xl font-semibold text-navy">{c?.name ?? "Choose someone"}</p>
                <p className="text-sm text-muted">{[c?.designation, c?.firm, c?.area].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => swap(i)} className="btn-secondary px-3 py-1.5 text-sm">Swap</button>
                <button type="button" onClick={() => setSlots((s) => s.filter((_, k) => k !== i))} className="px-2 text-sm font-semibold text-muted underline">Remove</button>
              </div>
            </div>
            <div>
              <label className="label" htmlFor={`who-${i}`}>Or choose from the queue</label>
              <select
                id={`who-${i}`}
                name="client_id"
                value={id}
                onChange={(e) => setSlots((s) => s.map((v, k) => (k === i ? e.target.value : v)))}
                className="input"
              >
                {candidates.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}{o.firm ? ` · ${o.firm}` : ""}{o.area ? ` · ${o.area}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-[10rem_8rem_1fr_10rem]">
              <div>
                <label className="label" htmlFor={`date-${i}`}>Date *</label>
                <input id={`date-${i}`} name="scheduled_for" type="date" required defaultValue={defaultDate} className="input" />
              </div>
              <div>
                <label className="label" htmlFor={`time-${i}`}>Time</label>
                <input id={`time-${i}`} name="scheduled_time" type="time" className="input" />
              </div>
              <div>
                <label className="label" htmlFor={`place-${i}`}>Place</label>
                <input key={id} id={`place-${i}`} name="place" defaultValue={c?.address ?? ""} className="input" />
              </div>
              <div>
                <label className="label" htmlFor={`att-${i}`}>Who attends</label>
                <select id={`att-${i}`} name="assigned_to" defaultValue={defaultAttendee ?? ""} className="input">
                  <option value="">—</option>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </fieldset>
        );
      })}
      {slots.length > 1 && new Set(slots.map(firmOf)).size < slots.length && (
        <p role="alert" className="text-sm font-semibold text-overdue">Two meetings are at the same firm. Swap one so each firm gets one meeting.</p>
      )}
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving…">{slots.length === 1 ? "Plan this meeting" : `Plan these ${slots.length} meetings`}</SubmitButton>
    </ActionForm>
  );
}
