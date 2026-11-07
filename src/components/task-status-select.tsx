"use client";

import { useState, useTransition } from "react";
import { setTaskStatus } from "@/app/actions/tasks";
import { TASK_STATUSES } from "@/lib/constants";

export function TaskStatusSelect({ id, status, large = false }: { id: string; status: string; large?: boolean }) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="shrink-0 text-right">
      <select
        aria-label="Status"
        value={value}
        disabled={pending}
        className={`rounded-lg border border-gray-400 bg-white font-semibold ${large ? "px-3 py-3 text-xl" : "px-2 py-1.5 text-sm"}`}
        onChange={(e) => {
          const next = e.target.value;
          const prev = value;
          setValue(next);
          setError(undefined);
          start(async () => {
            const res = await setTaskStatus(id, next);
            if (!res.ok) {
              setValue(prev);
              setError(res.error ?? "Could not update.");
            }
          });
        }}
      >
        {TASK_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      {pending && <p className="text-xs text-muted">Saving…</p>}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
