import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getClientOptions, getProfiles } from "@/lib/queries";
import { formatDate, todayISO } from "@/lib/dates";
import { TaskForm } from "@/components/task-form";
import { TaskStatusSelect } from "@/components/task-status-select";

export default async function AhmedTasks() {
  const me = await requireProfile();
  const supabase = await createClient();
  const [{ data: tasks, error }, profiles, clients] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date, status, client:clients(name)")
      .eq("owner", me.id)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false }),
    getProfiles(),
    getClientOptions(),
  ]);
  const today = todayISO();

  return (
    <div className="space-y-5">
      <Link href="/ahmed" className="text-lg font-semibold text-brand">← Home</Link>
      <h1 className="text-3xl font-bold">My tasks</h1>
      {error ? (
        <p role="alert" className="card text-red-700">Could not load tasks: {error.message}</p>
      ) : !tasks?.length ? (
        <p className="card text-muted">No open tasks. Add one below.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => {
            const client = Array.isArray(t.client) ? t.client[0] : t.client;
            return (
              <li key={t.id} className="card flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-semibold">{t.title}</p>
                  <p className={`text-lg ${t.due_date && t.due_date < today ? "font-semibold text-red-700" : "text-muted"}`}>
                    {t.due_date ? formatDate(t.due_date) : "No date"}{client ? ` · ${client.name}` : ""}
                  </p>
                </div>
                <TaskStatusSelect id={t.id} status={t.status} large />
              </li>
            );
          })}
        </ul>
      )}
      <h2 className="pt-2 text-2xl font-bold">Add a task for me</h2>
      <TaskForm profiles={profiles} clients={clients} currentUserId={me.id} simple />
    </div>
  );
}
