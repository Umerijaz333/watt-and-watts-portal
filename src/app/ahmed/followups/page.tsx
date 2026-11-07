import Link from "@/components/link";
import { getDueClients, getLastNotes } from "@/lib/queries";
import { daysFromToday, formatDate, formatDateTime, todayISO } from "@/lib/dates";
import { FollowUpActions } from "@/components/followup-actions";

export default async function AhmedFollowups() {
  const today = todayISO();
  const due = await getDueClients(today);
  const last = await getLastNotes(due.map((c) => c.id));
  return (
    <div className="space-y-4">
      <Link href="/ahmed" className="text-lg font-semibold text-link">← Home</Link>
      <h1 className="text-3xl font-bold">Follow-ups today</h1>
      {due.length === 0 ? (
        <div className="card space-y-4 text-center">
          <p className="text-2xl">Nothing due today.</p>
          <Link href="/ahmed/note" className="btn-primary w-full py-4 text-xl">Add meeting note</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {due.map((c) => {
            const days = daysFromToday(c.next_follow_up!);
            const note = last.get(c.id);
            return (
              <li key={c.id} className="space-y-3 rounded-2xl border-2 border-line bg-surface p-4">
                <Link href={`/ahmed/client/${c.id}`} className="block">
                  <p className="text-2xl font-bold text-navy underline decoration-line underline-offset-4">{c.name}</p>
                  {c.firm && <p className="text-lg">{c.firm}</p>}
                  <p className={`mt-1 text-lg font-semibold ${days < 0 ? "text-overdue" : "text-due"}`}>
                    {days < 0 ? `Overdue ${-days} day${days === -1 ? "" : "s"} (${formatDate(c.next_follow_up)})` : "Due today"}
                  </p>
                </Link>
                <div className="rounded-xl bg-tint p-3 text-lg">
                  <p className="text-base font-bold text-navy">Last time we spoke</p>
                  {note ? (
                    <>
                      <p className="line-clamp-3">{note.body}</p>
                      <p className="text-base">{formatDateTime(note.created_at)} · {note.author}</p>
                    </>
                  ) : (
                    <p>No notes yet.</p>
                  )}
                </div>
                <FollowUpActions clientId={c.id} phone={c.phone} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
