"use client";

import { useFormStatus } from "react-dom";
import { useHydrated } from "@/lib/use-hydrated";
import type { ActionState } from "@/lib/types";

export function SubmitButton({
  children,
  pendingText = "Saving…",
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const ready = useHydrated();
  return (
    <button type="submit" disabled={pending || !ready} className={className} aria-busy={pending || !ready}>
      {!ready ? "Loading…" : pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state, large = false }: { state: ActionState; large?: boolean }) {
  if (!state) return null;
  if (state.error)
    return (
      <p role="alert" className={`rounded-lg bg-overdue-tint p-3 font-medium text-overdue ${large ? "text-xl" : "text-sm"}`}>
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className={`rounded-lg bg-done-tint p-3 font-medium text-done ${large ? "text-xl" : "text-sm"}`}>
        {state.message}
      </p>
    );
  return null;
}
