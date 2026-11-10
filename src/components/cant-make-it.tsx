"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cantMakeIt } from "@/app/actions/outreach";
import { useHydrated } from "@/lib/use-hydrated";

/** Small "Can't make it" link: flags the meeting for Umer to reschedule. */
export function CantMakeIt({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const ready = useHydrated();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();
  return (
    <p className="text-center">
      <button
        type="button"
        disabled={!ready || pending}
        onClick={() => {
          if (!confirm(`Can't make it to ${name}? Umer will be told to find a new date.`)) return;
          setErr(undefined);
          start(async () => {
            const r = await cantMakeIt(id);
            if (r.ok) router.refresh();
            else setErr(r.error ?? "Could not save. Please try again.");
          });
        }}
        className="py-2 text-lg font-semibold text-muted underline"
      >
        {pending ? "Telling Umer…" : "Can't make it"}
      </button>
      {err && <span role="alert" className="block text-base text-overdue">{err}</span>}
    </p>
  );
}
