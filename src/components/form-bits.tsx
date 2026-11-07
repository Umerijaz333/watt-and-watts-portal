"use client";

import { createContext, useContext, useTransition, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { useHydrated } from "@/lib/use-hydrated";
import type { ActionState } from "@/lib/types";

const PendingContext = createContext<boolean | null>(null);

/**
 * Form that submits a useActionState action without React's automatic form reset,
 * so typed text is kept when a save fails. Forms reset themselves on success instead.
 */
export function ActionForm({
  action,
  pending,
  onSubmit,
  children,
  ...rest
}: Omit<ComponentProps<"form">, "action"> & { action: (fd: FormData) => void; pending: boolean }) {
  const [, start] = useTransition();
  return (
    <PendingContext.Provider value={pending}>
      <form
        {...rest}
        onSubmit={(e) => {
          onSubmit?.(e);
          if (e.defaultPrevented) return;
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(() => action(fd));
        }}
      >
        {children}
      </form>
    </PendingContext.Provider>
  );
}

export function SubmitButton({
  children,
  pendingText = "Saving…",
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const fromContext = useContext(PendingContext);
  const { pending: fromForm } = useFormStatus();
  const pending = fromContext ?? fromForm;
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
