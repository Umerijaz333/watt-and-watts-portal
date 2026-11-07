import { LoginForm } from "./login-form";
import { LogoMark } from "@/components/logo";

export const metadata = { title: "Log in · Watt & Watts" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex w-fit flex-col items-center gap-3 rounded-2xl bg-navy px-8 py-6 text-paper">
          <LogoMark size={56} />
          <span className="font-display text-2xl font-medium lowercase tracking-wide">watt &amp; watts</span>
        </div>
        <h1 className="sr-only">Watt &amp; Watts</h1>
        <p className="text-muted">Sign in to continue</p>
      </div>
      <LoginForm initialError={error === "no-profile" ? "Your account has no profile yet. Ask Umer to set it up." : undefined} />
    </main>
  );
}
