import Link from "@/components/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VIEW_COOKIE, prefersSimple } from "@/lib/view";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDueClients, getInbox } from "@/lib/queries";
import { ReviewInbox } from "@/components/review-inbox";
import { formatDate, todayISO, daysFromToday, greeting, todayLong, relativeDay } from "@/lib/dates";
import { Avatar } from "@/components/avatar";
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


  const first = profile.name.trim().split(/\s+/)[0];
  const openTasks = myTasks?.length ?? 0;
  const summary: string[] = [];
  if (due.length) summary.push(`${due.length} ${due.length === 1 ? "person" : "people"} to call`);
  if (overdue.length) summary.push(`${overdue.length} late`);
  if (inbox.items.length) summary.push(`${inbox.items.length} new from the team`);
  if (openTasks) summary.push(`${openTasks} open task${openTasks === 1 ? "" : "s"}`);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted">{todayLong()}</p>
          <h1 className="font-display text-3xl font-bold text-navy">{greeting()}, {first}</h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/view?mode=simple" className="text-sm font-semibold text-link underline sm:hidden">Simple view</a>
          <Link href="/clients/new" className="btn-primary">+ Add client</Link>
        </div>
      </div>

      <div className="rounded-3xl bg-navy p-5 text-paper shadow-soft">
        <p className="font-display text-xl font-semibold">
          {summary.length ? summary.join(" · ") : "All clear. Nobody to call today."}
        </p>
        <p className="mt-1 text-paper/80">
          {overdue.length
            ? "Start with the late ones below."
            : due.length
              ? "Everyone below is due today."
              : "A good day to add notes from recent meetings."}
        </p>
      </div>

      {(inbox.missingColumn || inbox.error || inbox.items.length > 0) && (
        <section>
          <h2 className="mb-1 text-lg font-bold text-navy">
            New to review <span className="text-muted">({inbox.items.length})</span>
          </h2>
          <p className="mb-3 text-sm text-muted">Notes, photos and clients the team added. Check them and tick them off.</p>
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
      )}

      <FollowUpList title="Overdue" hint="Call these first." tone="red" rows={overdue} empty="Nobody is late. Nice work." />
      <FollowUpList title="Due today" hint="People waiting to hear from us today." tone="blue" rows={dueToday} empty="Nobody else is due today." />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">My tasks</h2>
          <Link href="/tasks?filter=mine" className="text-sm font-semibold text-link">All tasks →</Link>
        </div>
        {taskErr ? (
          <p role="alert" className="card text-overdue">Could not load tasks: {taskErr.message}</p>
        ) : !myTasks?.length ? (
          <p className="card text-muted">
            Nothing on your list. <Link href="/tasks" className="font-semibold text-link">Add a task</Link>
          </p>
        ) : (
          <ul className="list-card">
            {myTasks.map((t) => {
              const client = Array.isArray(t.client) ? t.client[0] : t.client;
              const late = t.due_date && t.due_date < today;
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.title}</p>
                    <p className="text-sm text-muted">
                      {t.due_date ? (
                        <span className={late ? "font-semibold text-overdue" : ""}>{relativeDay(t.due_date)}</span>
                      ) : (
                        "No due date"
                      )}
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

function FollowUpList({ title, hint, tone, rows, empty }: { title: string; hint: string; tone: "red" | "blue"; rows: Row[]; empty: string }) {
  const color = tone === "red" ? "text-overdue" : "text-due";
  const pill = tone === "red" ? "bg-overdue-tint text-overdue" : "bg-tint text-due";
  return (
    <section>
      <h2 className={`text-lg font-bold ${color}`}>
        {title} <span className="text-muted">({rows.length})</span>
      </h2>
      <p className="mb-3 text-sm text-muted">{rows.length ? hint : ""}</p>
      {rows.length === 0 ? (
        <p className="card text-muted">{empty} <Link href="/clients" className="font-semibold text-link">See all clients</Link></p>
      ) : (
        <ul className="list-card">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/clients/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-tint">
                <Avatar name={c.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy">{c.name}</p>
                  <p className="truncate text-sm text-muted">{c.firm ?? "No firm"}</p>
                </div>
                <span className="hidden sm:inline"><StageChip stage={c.stage} /></span>
                <div className="text-right">
                  <span className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${pill}`}>
                    {c.next_follow_up ? relativeDay(c.next_follow_up) : ""}
                  </span>
                  <p className="mt-0.5 text-xs text-muted">{formatDate(c.next_follow_up)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
