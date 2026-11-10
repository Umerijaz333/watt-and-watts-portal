import Link from "next/link";
import { NoteIcon, CameraIcon, CalendarIcon, PhoneIcon } from "@/components/icons";
import { getWeekMeetings } from "@/lib/outreach";
import { requireProfile } from "@/lib/auth";
import { getDueClients } from "@/lib/queries";
import { todayISO, todayLong } from "@/lib/dates";

export default async function AhmedHome() {
  const today = todayISO();
  // Profile and follow-up count load at the same time.
  const [profile, count, toMeet] = await Promise.all([
    requireProfile(),
    getDueClients(today).then((d) => d.length).catch(() => null),
    getWeekMeetings().then((w) => (w.error ? null : w.meetings.filter((m) => m.status === "planned").length)),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-lg">{todayLong()}</p>
        <h1 className="font-display text-3xl font-bold text-navy">Salaam, {profile.name.trim().split(/\s+/)[0]}</h1>
        <p className="mt-1 text-xl">What would you like to do?</p>
      </div>

      <Link href="/ahmed/meetings" className="press flex min-h-28 items-center gap-4 rounded-3xl bg-btn px-6 py-6 text-white shadow-soft hover:bg-btn-hover">
        <CalendarIcon size={48} className="shrink-0" />
        <span className="flex-1">
          <span className="block font-display text-3xl font-bold">This week&apos;s meetings</span>
          <span className="block text-xl">{toMeet === null ? "" : toMeet === 0 ? "Nothing planned yet" : `${toMeet} to meet`}</span>
        </span>
      </Link>

      <Link href="/ahmed/note" className="press flex min-h-28 items-center gap-4 rounded-3xl bg-navy px-6 py-6 text-white shadow-soft">
        <NoteIcon size={48} className="shrink-0" />
        <span className="font-display text-3xl font-bold">Add meeting note</span>
      </Link>

      <Link href="/ahmed/photo" className="press flex min-h-28 items-center gap-4 rounded-3xl bg-surface px-6 py-6 text-navy shadow-soft">
        <CameraIcon size={48} className="shrink-0" />
        <span className="font-display text-3xl font-bold">Add photo of notes</span>
      </Link>

      <Link href="/ahmed/followups" className="press flex min-h-28 items-center gap-4 rounded-3xl bg-surface px-6 py-6 text-navy shadow-soft">
        <PhoneIcon size={48} className="shrink-0" />
        <span className="flex-1 font-display text-3xl font-bold">Who to call today</span>
        <span
          className={`flex h-16 min-w-16 items-center justify-center rounded-full px-3 text-3xl font-black ${count === null ? "bg-line text-ink" : count ? "bg-overdue text-white" : "bg-done text-white"}`}
          aria-label={`${count ?? "unknown"} people to call`}
        >
          {count ?? "?"}
        </span>
      </Link>

      <p className="pt-4 text-center text-lg">
        <Link href="/ahmed/tasks" className="font-semibold text-link underline">My to-do list</Link>
      </p>
    </div>
  );
}
