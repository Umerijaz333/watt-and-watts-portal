import type { DirectoryStatus } from "@/lib/outreach";
import { DirectoryImport } from "@/components/directory-import";

/** Clear next step when the queue is empty because setup is incomplete (instead of a blank list). */
export function DirectorySetup({ status }: { status: Exclude<DirectoryStatus, "ok"> }) {
  if (status === "not_imported")
    return (
      <div role="alert" className="card space-y-3 border-l-4 border-btn">
        <p className="font-display text-xl font-semibold text-navy">The architect list hasn&apos;t been imported yet.</p>
        <p>That is why the queue is empty and “Suggest next 2” finds nobody. Choose Ahmed&apos;s list below and tap Import. It is safe to do more than once: nothing is duplicated and nothing you edited is overwritten.</p>
        <DirectoryImport />
        <p className="text-sm text-muted">Use a computer or a phone that has the file. The file is the CSV of Ahmed&apos;s 324 architects (not the PDF).</p>
      </div>
    );
  return (
    <div role="alert" className="card space-y-3 border-l-4 border-overdue">
      <p className="font-display text-xl font-semibold text-navy">The architect directory isn&apos;t set up in the database yet.</p>
      <p>
        That is why the queue is empty. In Supabase, open <strong>SQL Editor → New query</strong>, paste the contents of{" "}
        <code>supabase/migrations/20261111000000_directory.sql</code> from the repository, and click Run. Then reload this page: it will offer to import the architect list.
      </p>
    </div>
  );
}
