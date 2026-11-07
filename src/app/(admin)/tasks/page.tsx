import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getClientOptions, getProfiles } from "@/lib/queries";
import { TASK_STATUSES } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/dates";
import { TaskForm } from "@/components/task-form";
import { TaskStatusSelect } from "@/components/task-status-select";
import { TaskDelete } from "@/components/task-delete";
import type { Task } from "@/lib/types";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const me = await requireAdmin();
  const { filter = "all" } = await searchParams;
  const [profiles, clients] = await Promise.all([getProfiles(), getClientOptions()]);
  const ahmed = profiles.find((p) => p.role === "simple");

  const supabase = await createClient();
  let q = supabase
    .from("tasks")
    .select("*, owner_profile:profiles!tasks_owner_fkey(name), client:clients(id, name)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (filter === "mine") q = q.eq("owner", me.id);
  if (filter === "ahmed" && ahmed) q = q.eq("owner", ahmed.id);
  const { data, error } = await q;
  const tasks = (data ?? []) as Task[];
  const today = todayISO();

  const filters = [
    { key: "all", label: "All" },
    { key: "mine", label: "Mine" },
    { key: "ahmed", label: `${ahmed?.name ?? "Ahmed"}'s` },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <TaskForm profiles={profiles} clients={clients} currentUserId={me.id} />

      <div className="flex gap-1" role="tablist">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`/tasks?filter=${f.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === f.key ? "bg-ink text-white" : "border border-line bg-white text-muted"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error ? (
        <p role="alert" className="card text-red-700">Could not load tasks: {error.message}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {TASK_STATUSES.map((col) => {
            const list = tasks.filter((t) => t.status === col.value);
            return (
              <section key={col.value} className="rounded-xl bg-gray-100 p-3">
                <h2 className="mb-2 font-bold">{col.label} <span className="text-muted">({list.length})</span></h2>
                {list.length === 0 ? (
                  <p className="p-2 text-sm text-muted">{col.value === "todo" ? "Nothing to do. Add a task above." : "Empty."}</p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((t) => {
                      const late = t.status !== "done" && t.due_date && t.due_date < today;
                      return (
                        <li key={t.id} className="rounded-lg border border-line bg-white p-3">
                          <div className="flex items-start gap-2">
                            <p className={`flex-1 font-medium ${t.status === "done" ? "text-muted line-through" : ""}`}>{t.title}</p>
                            <TaskStatusSelect id={t.id} status={t.status} />
                          </div>
                          {t.description && <p className="mt-1 text-sm text-muted">{t.description}</p>}
                          <p className="mt-2 flex flex-wrap gap-x-2 text-sm text-muted">
                            <span className="badge">{t.owner_profile?.name ?? "Unassigned"}</span>
                            <span className={late ? "font-semibold text-red-700" : ""}>{t.due_date ? formatDate(t.due_date) : "No due date"}</span>
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
