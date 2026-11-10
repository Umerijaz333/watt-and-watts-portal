import type { DirectoryStatus } from "@/lib/outreach";

/** Clear next step when the queue is empty because setup is incomplete (instead of a blank list). */
export function DirectorySetup({ status }: { status: Exclude<DirectoryStatus, "ok"> }) {
  return (
    <div role="alert" className="card space-y-3 border-l-4 border-overdue">
      <p className="font-display text-xl font-semibold text-navy">
        {status === "no_migration" ? "The architect directory isn't set up in the database yet." : "The architect list hasn't been imported yet."}
      </p>
      <p>That is why the queue is empty and “Suggest next 2” finds nobody. In Supabase, open <strong>SQL Editor → New query</strong> and run:</p>
      <ol className="list-decimal space-y-1 pl-6">
        {status === "no_migration" && (
          <li>
            the contents of <code>supabase/migrations/20261111000000_directory.sql</code> (from the repository), then
          </li>
        )}
        <li>
          the <code>import-architects.sql</code> file (made with <code>npm run import:architects -- --sql import-architects.sql</code>).
          It should report <strong>324 rows</strong>.
        </li>
      </ol>
      <p className="text-sm text-muted">Then reload this page. Both steps are safe to run more than once.</p>
    </div>
  );
}
