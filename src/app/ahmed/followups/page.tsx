import Link from "next/link";
import { getDueClients } from "@/lib/queries";
import { daysFromToday, formatDate, todayISO } from "@/lib/dates";

export default async function AhmedFollowups() {
  const today = todayISO();
  const due = await getDueClients(today);
  return (
    <div className="space-y-4">
      <Link href="/ahmed" className="text-lg font-semibold text-brand">← Home</Link>
      <h1 className="text-3xl font-bold">Follow-ups today</h1>
      {due.length === 0 ? (
        <div className="card space-y-4 text-center">
          <p className="text-2xl">Nothing due today. 🎉</p>
          <Link href="/ahmed/note" className="btn-primary w-full py-4 text-xl">Add meeting note</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {due.map((c) => {
            const days = daysFromToday(c.next_follow_up!);
            return (
              <li key={c.id}>
                <Link href={`/ahmed/client/${c.id}`} className="block rounded-2xl border-2 border-gray-300 bg-white p-4 active:bg-gray-100">
                  <p className="text-2xl font-bold">{c.name}</p>
                  {c.firm && <p className="text-lg text-muted">{c.firm}</p>}
                  <p className={`mt-1 text-lg font-semibold ${days < 0 ? "text-red-700" : "text-amber-700"}`}>
                    {days < 0 ? `Overdue ${-days} day${days === -1 ? "" : "s"} (${formatDate(c.next_follow_up)})` : "Due today"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
