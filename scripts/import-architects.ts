/**
 * Import Ahmed's Lahore architect directory into `clients`.
 *
 *   npm run import:architects                 # writes to Supabase (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
 *   npm run import:architects -- --sql out.sql # writes one SQL file to paste into the Supabase SQL Editor instead
 *
 * Idempotent: rows are matched on source_id (ARC-001…). New rows are inserted in full.
 * Existing rows only get their directory metadata refreshed (tier, rank, firm grouping, raw text);
 * names, phones, stage, notes, summaries, picks, skips and review status are never overwritten.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { prepareRows, importRows, METADATA } from "../src/lib/directory-import";

const FILE = "data/lahore_architects_structured.csv";

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
  const sqlOut = process.argv.includes("--sql") ? process.argv[process.argv.indexOf("--sql") + 1] : null;
  const text = readFileSync(FILE, "utf8");
  const { rows, skipped } = prepareRows(text);
  const flagged = rows.filter((r) => r.needs_review).length;

  if (sqlOut) {
    const cols = Object.keys(rows[0]);
    const values = rows.map((r) => `(${cols.map((c) => sqlValue((r as Record<string, unknown>)[c])).join(", ")})`).join(",\n");
    const sql = `-- Architect directory import (${rows.length} rows). Safe to run more than once.
-- Run AFTER supabase/migrations/20261111000000_directory.sql.
with up as (
  insert into clients (${cols.join(", ")})
  values
${values}
  on conflict (source_id) do update set
    ${METADATA.map((c) => `${c} = excluded.${c}`).join(",\n    ")}
  returning (xmax = 0) as inserted
)
select count(*) as rows_read,
       count(*) filter (where inserted) as inserted,
       count(*) filter (where not inserted) as updated,
       ${skipped} as skipped,
       ${flagged} as flagged_for_review
from up;
`;
    writeFileSync(sqlOut, sql);
    console.log(`Wrote ${sqlOut}: ${rows.length} rows (${skipped} skipped, ${flagged} flagged). Paste it into the Supabase SQL Editor and run.`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (or use --sql out.sql).");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const r = await importRows(supabase, text);
  console.log(`Rows read: ${r.read}\nInserted: ${r.inserted}\nUpdated (metadata only): ${r.updated}\nSkipped: ${r.skipped}\nFlagged for review: ${r.flagged}`);
}

main().catch((e) => {
  console.error("Import failed:", e.message ?? e);
  process.exit(1);
});
