import Link from "@/components/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VIEW_COOKIE, prefersSimple } from "@/lib/view";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDueClients, getInbox } from "@/lib/queries";
import { ReviewInbox } from "@/components/review-inbox";
import { formatDate, todayISO, daysFromToday } from "@/lib/dates";
import { StageChip } from "@/components/stage-chip";
import { TaskStatusSelect } from "@/components/task-status-select";

export default async function Dashboard() {
  const profile = await requireAdmin();
  if (prefersSimple(profile, (await cookies()).get(VIEW_COOKIE)?.value)) redirect("/ahmed");
  const today = todayISO();
  const supabase = await createClient();
  const [due, { data: myTasks, error: taskErr }, inbox] = await Promise.all([
    getDueClients(today),
    supabase
      .from("tasks")
      .select("id, title, due_date, status, client:clients(id, name)")
      .eq("owner", profile.id)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(10),
    getInbox(profile.id),
  ]);
  const overdue = due.filter((c) => c.next_follow_up! < today);
  const dueToday = due.filter((c) => c.next_follow_up === today);


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Follow-ups</h1>
          <p className="text-muted">Today is {formatDate(today)}</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/view?mode=simple" className="text-sm font-semibold text-link underline sm:hidden">Simple view</a>
          <Link href="/clients/new" className="btn-primary">+ Add client</Link>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-bold text-navy">
          New to review <span className="text-muted">({inbox.items.length})</span>
        </h2>
        {inbox.missingColumn ? (
          <p role="alert" className="card text-overdue">
            The review inbox needs a one-time database update: run <code>supabase/migrations/20261108000000_review_inbox.sql</code> in the Supabase SQL Editor.
          </p>
        ) : inbox.error ? (
          <p role="alert" className="card text-overdue">Could not load new items: {inbox.error}</p>
        ) : (
          <ReviewInbox items={inbox.items} />
        )}
      </section>

      <FollowUpList title="Overdue" tone="red" rows={overdue} empty="Nothing overdue. Well done." today={today} />
      <FollowUpList title="Due today" tone="blue" rows={dueToday} empty="No follow-ups due today." today={today} />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">My tasks</h2>
          <Link href="/tasks?filter=mine" className="text-sm font-semibold text-link">All tasks →</Link>
        </div>
        {taskErr ? (
          <p role="alert" className="card text-overdue">Could not load tasks: {taskErr.message}</p>
        ) : !myTasks?.length ? (
          <p className="card text-muted">
            No open tasks. <Link href="/tasks" className="font-semibold text-link">Add a task</Link>
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-white">
            {myTasks.map((t) => {
              const client = Array.isArray(t.client) ? t.client[0] : t.client;
              const late = t.due_date && t.due_date < today;
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.title}</p>
                    <p className="text-sm text-muted">
                      <span className={late ? "font-semibold text-overdue" : ""}>{late ? "Overdue · " : ""}{t.due_date ? formatDate(t.due_date) : "No due date"}</span>
                      {client && (
                        <> · <Link href={`/clients/${client.id}`} className="underline">{client.name}</Link></>
                      )}
                    </p>
                  </div>
                  <TaskStatusSelect id={t.id} status={t.status} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

type Row = { id: string; name: string; firm: string | null; stage: string | null; next_follow_up: string | null };

function FollowUpList({ title, tone, rows, empty, today }: { title: string; tone: "red" | "blue"; rows: Row[]; empty: string; today: string }) {
  const color = tone === "red" ? "text-overdue" : "text-due";
  const label = tone === "red" ? "Overdue" : "Due today";
  return (
    <section>
      <h2 className={`mb-2 text-lg font-bold ${color}`}>
        {title} <span className="text-muted">({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <p className="card text-muted">{empty} <Link href="/clients" className="font-semibold text-link">View all clients</Link></p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white">
          {rows.map((c) => {
            const days = c.next_follow_up ? daysFromToday(c.next_follow_up) : 0;
            return (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-tint">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-sm text-muted">{c.firm ?? "No firm"}</p>
                  </div>
                  <span className="hidden sm:inline"><StageChip stage={c.stage} /></span>
                  <div className="text-right text-sm">
                    <p className={`font-semibold ${color}`}>{formatDate(c.next_follow_up)}</p>
                    <p className={`text-xs font-semibold ${color}`}>{c.next_follow_up && c.next_follow_up < today ? `Overdue · ${-days} day${days === -1 ? "" : "s"}` : label}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
