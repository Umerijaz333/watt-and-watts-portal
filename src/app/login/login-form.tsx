"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(initialError);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError || !data.user) {
        setError(signInError?.message === "Invalid login credentials" ? "Wrong email or password." : signInError?.message ?? "Could not sign in.");
        return;
      }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      if (profileError || !profile) {
        setError("Signed in, but no profile was found for this account.");
        await supabase.auth.signOut();
        return;
      }
      router.replace(profile.role === "simple" ? "/ahmed" : "/");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" type="email" autoComplete="email" required className="input text-lg" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" type="password" autoComplete="current-password" required className="input text-lg" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
