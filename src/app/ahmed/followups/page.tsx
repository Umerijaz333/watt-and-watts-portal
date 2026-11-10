import Link from "@/components/link";
import { getDueClients, getLastNotes } from "@/lib/queries";
import { daysFromToday, formatDate, relativeDay, shortDate, todayISO } from "@/lib/dates";
import { FollowUpActions } from "@/components/followup-actions";
import { Avatar } from "@/components/avatar";

export default async function AhmedFollowups() {
  const today = todayISO();
  const due = await getDueClients(today);
  const last = await getLastNotes(due.map((c) => c.id));
  const late = due.filter((c) => c.next_follow_up! < today).length;

  return (
    <div>
      <Link href="/ahmed" className="text-lg font-semibold text-link">← Home</Link>

      <header className="mb-5 mt-3">
        <h1 className="font-display text-3xl font-bold leading-tight text-navy">Who to call today</h1>
        <p className="mt-1 text-xl">
          {due.length === 0
            ? "Nobody is waiting for a call."
            : `${due.length} ${due.length === 1 ? "person" : "people"} to call${late ? ` · ${late} ${late === 1 ? "is" : "are"} late` : ""}`}
        </p>
      </header>

      {due.length === 0 ? (
        <div className="space-y-4 rounded-3xl bg-surface p-6 text-center shadow-sm">
          <p className="font-display text-2xl font-semibold text-navy">All clear for today.</p>
          <p className="text-xl">Met someone new? Write it down while you remember.</p>
          <Link href="/ahmed/note" className="press btn-primary w-full rounded-full py-4 text-xl">Add meeting note</Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {due.map((c) => {
            const days = daysFromToday(c.next_follow_up!);
            const note = last.get(c.id);
            return (
              <li key={c.id} className="space-y-4 rounded-3xl bg-surface p-5 shadow-[0_2px_12px_rgba(20,32,90,0.08)]">
                <Link href={`/ahmed/client/${c.id}`} className="flex items-start gap-4">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-2xl font-semibold leading-tight text-navy">{c.name}</p>
                    {c.firm && <p className="text-lg leading-snug">{c.firm}</p>}
                    <span
                      className={`mt-1.5 inline-block rounded-full px-3 py-0.5 text-base font-semibold ${days < 0 ? "bg-overdue-tint text-overdue" : "bg-tint text-due"}`}
                      title={formatDate(c.next_follow_up)}
                    >
                      {relativeDay(c.next_follow_up!)}
                    </span>
                  </div>
                </Link>

                <div className="relative rounded-2xl rounded-tl-sm bg-paper p-4 text-lg">
                  {note ? (
                    <>
                      <p className="text-base font-semibold text-navy">Last time you spoke</p>
                      <p className="mt-1 line-clamp-3">“{note.body}”</p>
                      <p className="mt-1 text-base">— {note.author}, {shortDate(note.created_at)}</p>
                    </>
                  ) : (
                    <p>No notes yet. After the call, add what you talked about.</p>
                  )}
                </div>

                <FollowUpActions clientId={c.id} phone={c.phone} name={c.name} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
