import Link from "@/components/link";
import { NoteIcon, CameraIcon, CalendarIcon } from "@/components/icons";
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
        <p>{formatDate(today)}</p>
      </div>

      <Link href="/ahmed/note" className="flex min-h-28 items-center gap-4 rounded-2xl bg-btn px-6 py-6 text-white shadow-sm hover:bg-btn-hover active:bg-btn-hover">
        <NoteIcon size={48} className="shrink-0" />
        <span className="font-display text-3xl font-bold">Add meeting note</span>
      </Link>

      <Link href="/ahmed/photo" className="flex min-h-28 items-center gap-4 rounded-2xl bg-navy px-6 py-6 text-white shadow-sm active:bg-btn">
        <CameraIcon size={48} className="shrink-0" />
        <span className="font-display text-3xl font-bold">Add photo of notes</span>
      </Link>

      <Link href="/ahmed/followups" className="flex min-h-28 items-center gap-4 rounded-2xl border-4 border-navy bg-surface px-6 py-6 text-navy shadow-sm active:bg-tint">
        <CalendarIcon size={48} className="shrink-0" />
        <span className="flex-1 font-display text-3xl font-bold">My follow-ups today</span>
        <span
          className={`flex h-16 min-w-16 items-center justify-center rounded-full px-3 text-3xl font-black ${count === null ? "bg-line text-ink" : count ? "bg-overdue text-white" : "bg-done text-white"}`}
          aria-label={`${count ?? "unknown"} follow-ups`}
        >
          {count ?? "?"}
        </span>
      </Link>

      <p className="pt-4 text-center text-lg">
        <Link href="/ahmed/tasks" className="font-semibold text-link underline">My tasks</Link>
      </p>
    </div>
  );
}
