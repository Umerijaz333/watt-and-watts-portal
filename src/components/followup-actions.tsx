"use client";

import { useState, useTransition } from "react";
import { snoozeFollowUp } from "@/app/actions/clients";
import { CheckIcon, PhoneIcon } from "@/components/icons";
import { telHref, whatsappHref } from "@/lib/phone";
import { plusDays } from "@/lib/date-options";
import { formatDate } from "@/lib/dates";
import { useHydrated } from "@/lib/use-hydrated";

/** Call / WhatsApp / one-tap "call again later" for a client card. */
export function FollowUpActions({ clientId, phone, name }: { clientId: string; phone: string | null; name?: string }) {
  const ready = useHydrated();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string }>();
  const wa = phone ? whatsappHref(phone) : null;
  const first = name?.trim().split(/\s+/)[0];

  const move = (days: number) => {
    const date = plusDays(days);
    setResult(undefined);
    start(async () => {
      const res = await snoozeFollowUp(clientId, date, formatDate(date));
      // No refresh: the card stays with a clear confirmation instead of vanishing.
      if (res.ok) setResult({ ok: true, text: formatDate(date) });
      else setResult({ ok: false, text: res.error ?? "Could not save. Please try again." });
    });
  };

  if (result?.ok)
    return (
      <div role="status" className="animate-fade-up flex items-center gap-3 rounded-2xl bg-done-tint p-4">
        <span className="animate-pop flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-done text-white">
          <CheckIcon size={26} />
        </span>
        <p className="text-lg">
          <span className="font-bold text-done">Done!</span> We&apos;ll remind you to call{first ? ` ${first}` : ""} on{" "}
          <span className="font-semibold">{result.text}</span>.
        </p>
      </div>
    );

  return (
    <div className="space-y-3">
      {phone && (
        <div className="grid grid-cols-2 gap-3">
          <a href={telHref(phone)} className="press btn-primary rounded-full py-3.5 text-lg shadow-sm">
            <PhoneIcon size={22} /> Call
          </a>
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="press btn rounded-full bg-done py-3.5 text-lg text-white shadow-sm hover:opacity-90">
              WhatsApp
            </a>
          ) : (
            <span className="btn rounded-full bg-paper py-3.5 text-base text-muted">No WhatsApp</span>
          )}
        </div>
      )}
      <div>
        <p className="mb-2 text-base">Couldn&apos;t talk? Remind me again:</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" disabled={!ready || pending} onClick={() => move(1)} className="press btn rounded-full border-2 border-tint-strong bg-surface py-3 text-lg text-navy">
            Tomorrow
          </button>
          <button type="button" disabled={!ready || pending} onClick={() => move(7)} className="press btn rounded-full border-2 border-tint-strong bg-surface py-3 text-lg text-navy">
            Next week
          </button>
        </div>
      </div>
      {pending && <p className="text-base">Saving…</p>}
      {result && !result.ok && (
        <p role="alert" className="rounded-xl bg-overdue-tint p-3 text-base font-semibold text-overdue">{result.text}</p>
      )}
    </div>
  );
}
