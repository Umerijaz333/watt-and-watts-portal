import Link from "@/components/link";
import { requireAdmin, getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getClientOptions, getProfiles } from "@/lib/queries";
import { TASK_STATUSES } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/dates";
import { TaskForm } from "@/components/task-form";
import { TaskStatusSelect } from "@/components/task-status-select";
import { TaskDelete } from "@/components/task-delete";
import type { Task } from "@/lib/types";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "all" } = await searchParams;
  const supabase = await createClient();
  const myId = await getUserId(); // from the session token, no database trip
  // All four requests run at the same time; filtering happens here (the lists are small).
  const [me, profiles, clients, { data, error }] = await Promise.all([
    requireAdmin(),
    getProfiles(),
    getClientOptions(),
    supabase
      .from("tasks")
      .select("*, owner_profile:profiles!tasks_owner_fkey(name), client:clients(id, name)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);
  // Match by name so the filter keeps working whatever Ahmed's role is.
  const ahmed = profiles.find((p) => p.name.trim().toLowerCase() === "ahmed") ?? profiles.find((p) => p.role === "simple");
  const all = (data ?? []) as Task[];
  const tasks =
    filter === "mine" ? all.filter((t) => t.owner === myId) : filter === "ahmed" && ahmed ? all.filter((t) => t.owner === ahmed.id) : all;
  const today = todayISO();

  const filters = [
    { key: "all", label: "All" },
    { key: "mine", label: "Mine" },
    { key: "ahmed", label: `${ahmed?.name ?? "Ahmed"}'s` },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Tasks</h1>
        <p className="text-muted">Who is doing what, for both of you.</p>
      </div>
      <TaskForm profiles={profiles} clients={clients} currentUserId={me.id} />

      <div className="flex gap-1" role="tablist">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`/tasks?filter=${f.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === f.key ? "bg-navy text-white" : "bg-surface text-muted shadow-soft"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error ? (
        <p role="alert" className="card text-overdue">Could not load tasks: {error.message}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {TASK_STATUSES.map((col) => {
            const list = tasks.filter((t) => t.status === col.value);
            return (
              <section key={col.value} className={`rounded-2xl border-t-4 bg-white/50 p-3 ${col.value === "done" ? "border-done" : col.value === "doing" ? "border-link" : "border-navy"}`}>
                <h2 className="mb-3 font-bold text-navy">{col.label} <span className="text-muted">({list.length})</span></h2>
                {list.length === 0 ? (
                  <p className="p-2 text-sm text-muted">{col.value === "todo" ? "Nothing waiting. Add a task above." : col.value === "doing" ? "Nothing in progress." : "Nothing finished yet."}</p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((t) => {
                      const late = t.status !== "done" && t.due_date && t.due_date < today;
                      return (
                        <li key={t.id} className="rounded-2xl bg-surface p-3 shadow-soft">
                          <div className="flex items-start gap-2">
                            <p className={`flex-1 font-medium ${t.status === "done" ? "text-done line-through" : ""}`}>{t.status === "done" && <span className="sr-only">Done: </span>}{t.title}</p>
                            <TaskStatusSelect id={t.id} status={t.status} />
                          </div>
                          {t.description && <p className="mt-1 text-sm text-muted">{t.description}</p>}
                          <p className="mt-2 flex flex-wrap gap-x-2 text-sm text-muted">
                            <span className="badge border-tint-strong bg-tint text-navy">Owner: {t.owner_profile?.name ?? "Unassigned"}</span>
                            <span className={late ? "font-semibold text-overdue" : ""}>{late ? "Overdue · " : ""}{t.due_date ? formatDate(t.due_date) : "No due date"}</span>
                            {t.client && <Link href={`/clients/${t.client.id}`} className="underline">{t.client.name}</Link>}
                          </p>
                          <div className="mt-1 text-right"><TaskDelete id={t.id} /></div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
