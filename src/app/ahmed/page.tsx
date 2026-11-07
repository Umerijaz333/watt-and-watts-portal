import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getDueClients } from "@/lib/queries";
import { todayISO, formatDate } from "@/lib/dates";

export default async function AhmedHome() {
  const profile = await requireProfile();
  const today = todayISO();
  let count: number | null = null;
  try {
    count = (await getDueClients(today)).length;
  } catch {
    count = null;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-2xl font-bold">Salaam, {profile.name}</p>
        <p className="text-muted">{formatDate(today)}</p>
      </div>

      <Link href="/ahmed/note" className="flex min-h-28 items-center gap-4 rounded-2xl bg-brand px-6 py-6 text-white shadow-sm active:bg-brand-dark">
        <span className="text-5xl" aria-hidden>📝</span>
        <span className="text-3xl font-bold">Add meeting note</span>
      </Link>

      <Link href="/ahmed/photo" className="flex min-h-28 items-center gap-4 rounded-2xl bg-ink px-6 py-6 text-white shadow-sm active:bg-black">
        <span className="text-5xl" aria-hidden>📷</span>
        <span className="text-3xl font-bold">Add photo of notes</span>
      </Link>

      <Link href="/ahmed/followups" className="flex min-h-28 items-center gap-4 rounded-2xl border-4 border-ink bg-white px-6 py-6 text-ink shadow-sm active:bg-gray-100">
        <span className="text-5xl" aria-hidden>📅</span>
        <span className="flex-1 text-3xl font-bold">My follow-ups today</span>
        <span
          className={`flex h-16 min-w-16 items-center justify-center rounded-full px-3 text-3xl font-black ${count ? "bg-red-600 text-white" : "bg-gray-200 text-ink"}`}
          aria-label={`${count ?? "unknown"} follow-ups`}
        >
          {count ?? "?"}
        </span>
      </Link>

      <p className="pt-4 text-center text-lg">
        <Link href="/ahmed/tasks" className="font-semibold text-muted underline">My tasks</Link>
      </p>
    </div>
  );
}
