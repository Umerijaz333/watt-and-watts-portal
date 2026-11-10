import Link from "@/components/link";
import { requireProfile } from "@/lib/auth";

export default async function AhmedLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <div className="mx-auto min-h-dvh max-w-lg text-xl text-ink">
      <header className="flex items-center justify-between bg-navy px-4 py-2.5 text-paper">
        <Link href="/ahmed" className="flex items-center gap-2 font-display font-bold text-paper">
          <span>Home</span>
        </Link>
        <div className="flex items-center gap-1">
          {profile.role === "admin" && (
            <a href="/view?mode=full" className="rounded-lg px-3 py-2 text-base font-semibold text-paper">Full view</a>
          )}
          <form action="/auth/signout" method="post">
            <button className="rounded-lg px-3 py-2 text-base font-semibold text-paper">Sign out</button>
          </form>
        </div>
      </header>
      <main className="px-4 py-5">{children}</main>
    </div>
  );
}
