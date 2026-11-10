import Link from "@/components/link";
import { requireAdmin } from "@/lib/auth";
import { getQueue } from "@/lib/outreach";
import { PrintButton } from "@/components/print-button";
import { formatDate, todayISO } from "@/lib/dates";

export const metadata = { title: "Architects to meet · print" };

export default async function QueuePrint() {
  const [, queue] = await Promise.all([requireAdmin(), getQueue()]);
  const byArea = new Map<string, typeof queue>();
  for (const r of queue) {
    const a = r.area || "Other / unknown";
    byArea.set(a, [...(byArea.get(a) ?? []), r]);
  }
  const areas = [...byArea.keys()].sort((a, b) => byArea.get(b)!.length - byArea.get(a)!.length || a.localeCompare(b));

  return (
    <div className="print-sheet space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <Link href="/queue" className="text-sm font-semibold text-link">← Back to the queue</Link>
          <h1 className="font-display text-2xl font-bold text-navy">Printable list for Ahmed</h1>
          <p className="text-muted">A4, grouped by area. Ahmed ticks who he wants to meet first; then mark those as Ahmed&apos;s picks in the queue.</p>
        </div>
        <PrintButton label="Print this list" />
      </div>

      <header className="hidden print:block">
        <h1 className="text-xl font-bold">Watt &amp; Watts · Architects to meet</h1>
        <p className="text-sm">Printed {formatDate(todayISO())} · {queue.length} firms · Tick ✓ the ones to meet first</p>
      </header>

      {areas.map((area) => (
        <section key={area} className="print-area rounded-2xl bg-surface p-4 shadow-soft print:rounded-none print:p-0 print:shadow-none">
          <h2 className="mb-2 font-display text-lg font-bold text-navy print:text-base print:text-black">
            {area} <span className="font-normal text-muted print:text-black">({byArea.get(area)!.length})</span>
          </h2>
          <table className="w-full border-collapse text-sm print:text-[9pt]">
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th className="w-8 py-1 pr-2">✓</th>
                <th className="py-1 pr-2">Name</th>
                <th className="py-1 pr-2">Designation</th>
                <th className="py-1 pr-2">Firm</th>
                <th className="py-1 pr-2">Phone</th>
                <th className="py-1">Address</th>
              </tr>
            </thead>
            <tbody>
              {byArea.get(area)!.map((r) => (
                <tr key={r.id} className="break-inside-avoid border-b border-line align-top print:border-gray-400">
                  <td className="py-1.5 pr-2"><span className="inline-block h-4 w-4 border-2 border-ink" aria-label="tick box" /></td>
                  <td className="py-1.5 pr-2 font-semibold">{r.name}{r.ahmed_pick ? " ★" : ""}</td>
                  <td className="py-1.5 pr-2">{r.designation ?? ""}</td>
                  <td className="py-1.5 pr-2">{r.firm ?? ""}</td>
                  <td className="whitespace-nowrap py-1.5 pr-2">{r.mobile || r.landline || r.phone || ""}</td>
                  <td className="py-1.5">{r.address ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
