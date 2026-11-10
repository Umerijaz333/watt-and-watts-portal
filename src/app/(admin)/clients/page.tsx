import Link from "@/components/link";
import { createClient } from "@/lib/supabase/server";
import { STAGES } from "@/lib/constants";
import { StageChip } from "@/components/stage-chip";
import { Avatar } from "@/components/avatar";
import { formatDate, relativeDay, todayISO } from "@/lib/dates";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string }> }) {
  const { q = "", stage = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("id, name, firm, phone, city, stage, next_follow_up")
    .order("name");
  const term = q.trim().replace(/[%,()]/g, " ");
  if (term) query = query.or(`name.ilike.%${term}%,firm.ilike.%${term}%,phone.ilike.%${term}%,city.ilike.%${term}%`);
  if (stage && STAGES.some((s) => s.value === stage)) query = query.eq("stage", stage);
  const { data: clients, error } = await query;
  const today = todayISO();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link href="/clients/new" className="btn-primary">+ Add client</Link>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row" role="search">
        <input name="q" defaultValue={q} placeholder="Find a client by name, firm, phone or city" className="input flex-1" aria-label="Search clients" />
        <select name="stage" defaultValue={stage} className="input sm:w-48" aria-label="Filter by stage">
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button className="btn-secondary">Search</button>
      </form>

      {error ? (
        <p role="alert" className="card text-overdue">Could not load clients: {error.message}</p>
      ) : !clients?.length ? (
        <div className="card text-center">
          <p className="mb-3 text-muted">{q || stage ? "Nobody matches that search." : "No clients yet. Add the architects and builders you work with."}</p>
          {q || stage ? (
            <Link href="/clients" className="btn-secondary">Clear search</Link>
          ) : (
            <Link href="/clients/new" className="btn-primary">Add your first client</Link>
          )}
        </div>
      ) : (
        <ul className="list-card">
          {clients.map((c) => {
            const late = c.next_follow_up && c.next_follow_up < today;
            const isToday = c.next_follow_up === today;
            return (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-tint">
                  <Avatar name={c.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy">{c.name}</p>
                    <p className="truncate text-sm text-muted">{[c.firm, c.city].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <StageChip stage={c.stage} />
                  <span
                    title={c.next_follow_up ? formatDate(c.next_follow_up) : undefined}
                    className={`hidden w-28 shrink-0 rounded-full px-3 py-0.5 text-center text-sm font-semibold sm:inline-block ${late ? "bg-overdue-tint text-overdue" : isToday ? "bg-tint text-due" : "text-muted"}`}
                  >
                    {c.next_follow_up ? relativeDay(c.next_follow_up) : "No follow-up"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
