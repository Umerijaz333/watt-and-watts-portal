"use client";

import { useState, useTransition } from "react";
import { deleteTask } from "@/app/actions/tasks";

export function TaskDelete({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();
  return (
    <>
      <button
        type="button"
        disabled={pending}
        className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-60"
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
      {err && <span role="alert" className="text-xs text-red-700"> {err}</span>}
    </>
  );
}
