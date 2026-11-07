import Link from "next/link";
import { requireProfile } from "@/lib/auth";

export default async function AhmedLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <div className="mx-auto min-h-dvh max-w-lg text-xl">
      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
        <Link href="/ahmed" className="flex items-center gap-2 font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">W</span>
          <span>Home</span>
        </Link>
        <div className="flex items-center gap-1">
          {profile.role === "admin" && (
            <Link href="/" className="rounded-lg px-3 py-2 text-base font-semibold text-muted">Admin</Link>
          )}
          <form action="/auth/signout" method="post">
            <button className="rounded-lg px-3 py-2 text-base font-semibold text-muted">Sign out</button>
          </form>
        </div>
      </header>
      <main className="px-4 py-5">{children}</main>
    </div>
  );
}
