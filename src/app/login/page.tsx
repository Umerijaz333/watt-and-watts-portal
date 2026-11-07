import { LoginForm } from "./login-form";

export const metadata = { title: "Log in · Watt & Watts" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold text-navy">Watt &amp; Watts</h1>
        <p className="text-muted">Sign in to continue</p>
      </div>
      <LoginForm initialError={error === "no-profile" ? "Your account has no profile yet. Ask Umer to set it up." : undefined} />
    </main>
  );
}
