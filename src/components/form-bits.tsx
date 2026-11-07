"use client";

import { useFormStatus } from "react-dom";
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
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state, large = false }: { state: ActionState; large?: boolean }) {
  if (!state) return null;
  if (state.error)
    return (
      <p role="alert" className={`rounded-lg bg-red-50 p-3 font-medium text-red-800 ${large ? "text-xl" : "text-sm"}`}>
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className={`rounded-lg bg-green-50 p-3 font-medium text-green-800 ${large ? "text-xl" : "text-sm"}`}>
        {state.message}
      </p>
    );
  return null;
}
