import Link from "@/components/link";
import { getWeekMeetings, weekRange, callNumber, mapsHref, meetingWhen } from "@/lib/outreach";
import { telHref } from "@/lib/phone";
import { formatDate } from "@/lib/dates";
import { Avatar } from "@/components/avatar";
import { PhoneIcon, NoteIcon } from "@/components/icons";
import { CantMakeIt } from "@/components/cant-make-it";

export default async function AhmedMeetings() {
  const range = weekRange();
  const week = await getWeekMeetings(range);
  const planned = week.meetings.filter((m) => m.status === "planned");
  const waiting = week.meetings.filter((m) => m.needs_reschedule);
  const done = week.meetings.filter((m) => m.status === "done" && m.scheduled_for >= range.start);

  return (
    <div className="space-y-5">
      <Link href="/ahmed" className="text-lg font-semibold text-link">← Home</Link>
      <header>
        <h1 className="font-display text-3xl font-bold leading-tight text-navy">This week&apos;s meetings</h1>
        <p className="mt-1 text-xl">
          {planned.length === 0 ? "Nothing planned yet." : `${planned.length} to meet`}
          {done.length ? ` · ${done.length} done` : ""}
        </p>
      </header>

      {week.error ? (
        <p role="alert" className="card text-xl text-overdue">Could not load meetings. Please try again in a moment.</p>
      ) : planned.length === 0 ? (
        <div className="card space-y-3 text-center text-xl">
          <p>Umer hasn&apos;t planned any meetings for {formatDate(range.start)} – {formatDate(range.end)} yet.</p>
          <Link href="/ahmed/note" className="btn-primary w-full py-4 text-xl">Add meeting note</Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {planned.map((m) => {
            const c = m.client!;
            const num = callNumber(c);
            const late = m.scheduled_for < range.start;
            return (
              <li key={m.id} className="space-y-4 rounded-3xl bg-surface p-5 shadow-soft">
                <div className="flex items-start gap-4">
                  <Avatar name={c.name} />
                  <div className="min-w-0">
                    <p className="font-display text-2xl font-semibold leading-tight text-navy">{c.name}</p>
                    <p className="text-lg">{[c.designation, c.firm].filter(Boolean).join(", ")}</p>
                    {c.area && <p className="mt-1 inline-block rounded-full bg-tint px-3 py-0.5 text-base font-semibold text-navy">{c.area}</p>}
                  </div>
                </div>
                <p className={`rounded-2xl p-3 text-xl font-semibold ${late ? "bg-overdue-tint text-overdue" : "bg-tint text-navy"}`}>
                  {late ? "Was due: " : ""}{meetingWhen(m.scheduled_for, m.scheduled_time)}
                  {(m.place || c.address) && <span className="block text-lg font-normal text-ink">{m.place || c.address}</span>}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {num ? (
                    <a href={telHref(num)} className="press btn-primary py-4 text-xl"><PhoneIcon size={24} /> Call</a>
                  ) : (
                    <span className="btn rounded-full bg-paper py-4 text-lg text-muted">No number</span>
                  )}
                  <a href={mapsHref(m.place || c.address, c.name)} target="_blank" rel="noreferrer" className="press btn-secondary py-4 text-xl">Map</a>
                </div>
                <Link href={`/ahmed/note?client=${c.id}&meeting=${m.id}`} className="press btn w-full bg-navy py-5 text-2xl text-white">
                  <NoteIcon size={28} /> I met them
                </Link>
                <CantMakeIt id={m.id} name={c.name} />
              </li>
            );
          })}
        </ul>
      )}

      {waiting.length > 0 && (
        <section className="card space-y-2 text-xl">
          <h2 className="font-display text-xl font-bold text-navy">Waiting for a new date</h2>
          {waiting.map((m) => (
            <p key={m.id}>{m.client?.name}: Umer will set a new date.</p>
          ))}
        </section>
      )}
    </div>
  );
}
