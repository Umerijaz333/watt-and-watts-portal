"use client";

import { useHydrated } from "@/lib/use-hydrated";
import { useState, useTransition } from "react";
import { deleteTask } from "@/app/actions/tasks";

export function TaskDelete({ id }: { id: string }) {
  const ready = useHydrated();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();
  return (
    <>
      <button
        type="button"
        disabled={pending || !ready}
        className="text-xs font-semibold text-overdue hover:underline disabled:opacity-60"
        onClick={() => {
          if (!confirm("Delete this task?")) return;
          setErr(undefined);
          start(async () => {
            const res = await deleteTask(id);
            if (!res.ok) setErr(res.error);
          });
        }}
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {err && <span role="alert" className="text-xs text-overdue"> {err}</span>}
    </>
  );
}
