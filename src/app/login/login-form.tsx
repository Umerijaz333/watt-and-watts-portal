"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/form-bits";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const error = state?.error ?? (state ? undefined : initialError);

  return (
    <ActionForm action={action} pending={pending} className="card space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input text-lg" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input text-lg" />
      </div>
      {error && <p role="alert" className="rounded-xl bg-overdue-tint p-3 text-sm font-medium text-overdue">{error}</p>}
      <SubmitButton className="btn-primary w-full py-3 text-lg" pendingText="Signing in…">Sign in</SubmitButton>
    </ActionForm>
  );
}
