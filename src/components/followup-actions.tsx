"use client";

import { useState, useTransition } from "react";
import { snoozeFollowUp } from "@/app/actions/clients";
import { PhoneIcon } from "@/components/icons";
import { telHref, whatsappHref } from "@/lib/phone";
import { plusDays } from "@/lib/date-options";
import { formatDate } from "@/lib/dates";
import { useHydrated } from "@/lib/use-hydrated";

/** Call / WhatsApp / one-tap "move follow-up" buttons for a client card. */
export function FollowUpActions({ clientId, phone }: { clientId: string; phone: string | null }) {
  const ready = useHydrated();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string }>();
  const wa = phone ? whatsappHref(phone) : null;

  const move = (days: number) => {
    const date = plusDays(days);
    setResult(undefined);
    start(async () => {
      const res = await snoozeFollowUp(clientId, date, formatDate(date));
      // No refresh here: the card stays with a clear confirmation instead of vanishing.
      if (res.ok) setResult({ ok: true, text: `Moved to ${formatDate(date)}` });
      else setResult({ ok: false, text: res.error ?? "Could not save." });
    });
  };

  return (
    <div className="space-y-2">
      {phone && (
        <div className="grid grid-cols-2 gap-2">
          <a href={telHref(phone)} className="btn-primary py-3 text-lg"><PhoneIcon size={22} /> Call</a>
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="btn py-3 text-lg bg-done text-white hover:opacity-90">WhatsApp</a>
          ) : (
            <span className="btn-secondary py-3 text-base opacity-60">No WhatsApp</span>
          )}
        </div>
      )}
      {!result?.ok && (
        <>
          <p className="pt-1 text-base font-semibold">Move follow-up to:</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={!ready || pending} onClick={() => move(1)} className="btn-secondary border-2 py-3 text-lg">Tomorrow</button>
            <button type="button" disabled={!ready || pending} onClick={() => move(7)} className="btn-secondary border-2 py-3 text-lg">Next week</button>
          </div>
        </>
      )}
      {pending && <p className="text-base">Saving…</p>}
      {result && (
        <p role={result.ok ? "status" : "alert"} className={`rounded-lg p-2 text-base font-semibold ${result.ok ? "bg-done-tint text-done" : "bg-overdue-tint text-overdue"}`}>
          {result.ok ? "✓ " : ""}{result.text}
        </p>
      )}
    </div>
  );
}
