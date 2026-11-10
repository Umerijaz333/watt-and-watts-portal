import Link from "@/components/link";
import { requireAdmin } from "@/lib/auth";
import { getProfiles } from "@/lib/queries";
import {
  getQueue, getBusyFirms, getWeekMeetings, weekRange, weekProgress, suggest, firmKey,
  meetingWhen, reminderText, reminderHref, callNumber, WEEKLY_TARGET, AHMED_WHATSAPP,
} from "@/lib/outreach";
import { todayISO } from "@/lib/dates";
import { plusDays } from "@/lib/date-options";
import { PlanForm, type Candidate } from "@/components/plan-form";
import { MeetingAdmin } from "@/components/meeting-admin";
import { WeekProgress } from "@/components/week-progress";

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ suggest?: string; client?: string }> }) {
  const sp = await searchParams;
  const range = weekRange();
  const [me, profiles, queue, busy, week] = await Promise.all([requireAdmin(), getProfiles(), getQueue(), getBusyFirms(), getWeekMeetings(range)]);
  if (week.missingTable)
    return (
      <p role="alert" className="card text-overdue">
        The weekly plan needs a one-time database update: run <code>supabase/migrations/20261111000000_directory.sql</code> in the Supabase SQL Editor.
      </p>
    );

  const progress = weekProgress(week.meetings, range);
  const open = queue.filter((r) => !busy.has(firmKey(r)));
  const seed = sp.client ? queue.find((r) => r.id === sp.client) : undefined;
  const initial = seed ? suggest(open, new Set(), 2, [seed]) : sp.suggest === "1" ? suggest(open, new Set(), 2) : [];
  const candidates: Candidate[] = [...new Map([...initial, ...open.slice(0, 60)].map((r) => [r.id, r])).values()].map((r) => ({
    id: r.id, name: r.name, designation: r.designation, firm: r.firm, area: r.area, address: r.address, firmKey: firmKey(r),
  }));
  const ahmed = profiles.find((p) => p.name.trim().toLowerCase() === "ahmed") ?? profiles.find((p) => p.role === "simple");
  const today = todayISO();
  const defaultDate = today < range.start ? range.start : today > range.end ? plusDays(2, range.end) : today;

  const plannedThisWeek = week.meetings.filter((m) => m.status === "planned" && m.scheduled_for <= range.end);
  const wa = reminderHref(reminderText(plannedThisWeek));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">This week&apos;s plan</h1>
          <p className="text-muted">Target: {WEEKLY_TARGET} architect meetings a week, Monday to Saturday.</p>
        </div>
        <Link href="/queue" className="btn-secondary">Open the queue</Link>
      </div>

      <WeekProgress done={progress.done} planned={progress.planned} target={progress.target} start={range.start} end={range.end} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-navy">Plan meetings</h2>
          <Link href="/plan?suggest=1" className="btn-primary">Suggest next {WEEKLY_TARGET === 2 ? "2" : WEEKLY_TARGET}</Link>
        </div>
        {initial.length === 0 ? (
          <p className="card text-muted">
            Tap <strong>Suggest next 2</strong> to pick from the queue (Ahmed&apos;s picks first, one per firm, same area where possible),
            or use <Link href="/queue" className="font-semibold text-link">Plan meeting</Link> on anyone in the queue.
            {open.length === 0 && " The queue is empty: every firm has a meeting or was skipped."}
          </p>
        ) : (
          <PlanForm
            key={initial.map((r) => r.id).join(",")}
            candidates={candidates}
            initial={initial.map((r) => r.id)}
            profiles={profiles}
            defaultAttendee={ahmed?.id ?? me.id}
            defaultDate={defaultDate}
          />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-navy">Meetings this week ({week.meetings.length})</h2>
          {plannedThisWeek.length > 0 &&
            (wa ? (
              <a href={wa} target="_blank" rel="noreferrer" className="btn bg-done text-white hover:opacity-90">Send reminder to Ahmed</a>
            ) : (
              <span className="text-sm text-overdue">
                Set <code>AHMED_WHATSAPP</code> in Vercel to enable the WhatsApp reminder.
              </span>
            ))}
        </div>
        {week.error && !week.missingTable ? (
          <p role="alert" className="card text-overdue">Could not load meetings: {week.error}</p>
        ) : week.meetings.length === 0 ? (
          <p className="card text-muted">Nothing planned yet this week. Use Suggest next 2 above.</p>
        ) : (
          <ul className="list-card">
            {week.meetings.map((m) => (
              <MeetingAdmin key={m.id} m={m} when={meetingWhen(m.scheduled_for, m.scheduled_time)} phone={m.client ? callNumber(m.client) : null} />
            ))}
          </ul>
        )}
        {!AHMED_WHATSAPP && plannedThisWeek.length === 0 && (
          <p className="text-xs text-muted">Tip: set AHMED_WHATSAPP (digits only, e.g. 923001234567) in Vercel to send Ahmed his weekly list on WhatsApp.</p>
        )}
      </section>
    </div>
  );
}
