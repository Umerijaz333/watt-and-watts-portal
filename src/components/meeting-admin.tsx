"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/link";
import { rescheduleMeeting, skipMeeting } from "@/app/actions/outreach";
import { addNote } from "@/app/actions/notes";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form-bits";
import { useHydrated } from "@/lib/use-hydrated";
import { useRefreshOnSuccess } from "@/lib/use-refresh";
import { QUICK_DATES, plusDays } from "@/lib/date-options";
import { telHref } from "@/lib/phone";
import type { WeekMeeting } from "@/lib/outreach";

const STATUS: Record<string, { label: string; cls: string }> = {
  planned: { label: "Planned", cls: "bg-tint text-due" },
  done: { label: "Done", cls: "bg-done-tint text-done" },
  skipped: { label: "Skipped", cls: "bg-[#e6e8ec] text-[#3c4250]" },
  rescheduled: { label: "Needs a new date", cls: "bg-overdue-tint text-overdue" },
};

/** One meeting on the weekly plan, with Mark done / Reschedule / Skip. */
export function MeetingAdmin({ m, when, phone }: { m: WeekMeeting; when: string; phone: string | null }) {
  const router = useRouter();
  const ready = useHydrated();
  const [mode, setMode] = useState<"none" | "done" | "reschedule">(m.needs_reschedule ? "reschedule" : "none");
  const [date, setDate] = useState(m.scheduled_for);
  const [time, setTime] = useState(m.scheduled_time?.slice(0, 5) ?? "");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();
  const c = m.client;
  const st = STATUS[m.status] ?? STATUS.planned;
  const open = m.status === "planned" || m.needs_reschedule;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setErr(undefined);
    start(async () => {
      const r = await fn();
      if (r.ok) {
        setMode("none");
        router.refresh();
      } else setErr(r.error ?? "Could not save.");
    });
  };

  return (
    <li className="space-y-3 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <Link href={`/clients/${m.client_id}`} className="font-semibold text-navy hover:underline">{c?.name}</Link>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
            {m.needs_reschedule && <span className="text-xs font-semibold text-overdue">Ahmed can&apos;t make it</span>}
          </p>
          <p className="text-sm text-muted">{[c?.designation, c?.firm, c?.area].filter(Boolean).join(" · ")}</p>
          <p className="text-sm">
            {when}
            {m.assigned?.name ? ` · ${m.assigned.name}` : ""}
            {phone && <> · <a href={telHref(phone)} className="font-semibold text-link">{phone}</a></>}
          </p>
          {m.status === "done" && m.outcome_note && <p className="mt-1 line-clamp-2 text-sm">“{m.outcome_note}”</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {open && (
            <>
              <button type="button" disabled={!ready || pending} onClick={() => setMode(mode === "done" ? "none" : "done")} className="btn bg-done px-3 py-1.5 text-sm text-white">Mark done</button>
              <button type="button" disabled={!ready || pending} onClick={() => setMode(mode === "reschedule" ? "none" : "reschedule")} className="btn-secondary px-3 py-1.5 text-sm">Reschedule</button>
              <button
                type="button"
                disabled={!ready || pending}
                onClick={() => confirm(`Skip the meeting with ${c?.name}?`) && run(() => skipMeeting(m.id))}
                className="px-2 text-sm font-semibold text-muted underline"
              >
                Skip
              </button>
            </>
          )}
          <Link href={`/meetings/${m.id}/brief`} className="btn-secondary px-3 py-1.5 text-sm">Brief</Link>
        </div>
      </div>

      {mode === "reschedule" && (
        <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-tint p-3">
          <div>
            <label className="label" htmlFor={`rd-${m.id}`}>New date</label>
            <input id={`rd-${m.id}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label" htmlFor={`rt-${m.id}`}>Time</label>
            <input id={`rt-${m.id}`} type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" />
          </div>
          <button type="button" disabled={!ready || pending} onClick={() => run(() => rescheduleMeeting(m.id, date, time))} className="btn-primary">
            {pending ? "Saving…" : "Save new date"}
          </button>
        </div>
      )}
      {mode === "done" && <DoneForm m={m} onDone={() => setMode("none")} />}
      {err && <p role="alert" className="text-sm text-overdue">{err}</p>}
    </li>
  );
}

/** Marking a meeting done requires a note and a next follow-up date. */
function DoneForm({ m, onDone }: { m: WeekMeeting; onDone: () => void }) {
  const [state, action, pending] = useActionState(addNote, null);
  const [follow, setFollow] = useState("");
  useRefreshOnSuccess(state, onDone);
  return (
    <ActionForm action={action} pending={pending} className="space-y-3 rounded-2xl bg-done-tint p-3">
      <input type="hidden" name="client_id" value={m.client_id} />
      <input type="hidden" name="meeting_id" value={m.id} />
      <div>
        <label className="label" htmlFor={`b-${m.id}`}>How did the meeting go? *</label>
        <textarea id={`b-${m.id}`} name="body" required rows={3} className="input" />
      </div>
      <div>
        <label className="label" htmlFor={`p-${m.id}`}>What are we waiting for from them?</label>
        <input id={`p-${m.id}`} name="pending_from_client" className="input" />
      </div>
      <div>
        <label className="label" htmlFor={`f-${m.id}`}>Next follow-up *</label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK_DATES.slice(1).map((q) => (
            <button key={q.label} type="button" onClick={() => setFollow(plusDays(q.days))} className="btn-secondary px-3 py-1 text-sm">{q.label}</button>
          ))}
        </div>
        <input id={`f-${m.id}`} name="next_follow_up" type="date" required value={follow} onChange={(e) => setFollow(e.target.value)} className="input sm:w-56" />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving…">Save and mark done</SubmitButton>
    </ActionForm>
  );
}
