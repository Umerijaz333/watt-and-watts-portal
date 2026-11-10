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

const FILE = "data/lahore_architects_structured.csv";

/** Minimal RFC 4180 CSV parser (quoted fields, commas and newlines inside quotes). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((c) => c !== "")) rows.push(row); }
  const [header, ...body] = rows;
  const keys = header.map((h) => h.replace(/^﻿/, "").trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const nul = (s: string) => (s === "" ? null : s);
const int = (s: string) => (s === "" || Number.isNaN(Number(s)) ? null : Number.parseInt(s, 10));

type Row = Record<string, string>;

/** Full row for a new client. */
function toClient(r: Row) {
  const flags = r.flags.split(";").map((f) => f.trim()).filter(Boolean);
  const type = r.type === "architect" || r.type === "interior_designer" || r.type === "builder" ? r.type : "other";
  const name = flags.includes("name_is_firm") && r.firm ? r.firm : r.name;
  return {
    source_id: r.source_id,
    name,
    firm: nul(r.firm),
    designation: nul(r.designation),
    address: nul(r.address),
    area: nul(r.area),
    city: "Lahore",
    landline: nul(r.landline),
    mobile: nul(r.mobile),
    phone: nul(r.mobile) ?? nul(r.landline),
    phones_raw: nul(r.phones_raw),
    type,
    stage: "not_contacted",
    tier: nul(r.tier),
    firm_group: nul(r.firm_group),
    firm_contacts: int(r.firm_contacts) ?? 1,
    is_firm_primary: r.is_firm_primary.toLowerCase() === "yes",
    suggested_rank: int(r.suggested_rank),
    needs_review: flags.length > 0,
    review_flags: flags.length ? flags.join(", ") : null,
    duplicate_of: nul(r.possible_duplicate_of),
    source_raw: nul(r.raw_block),
    created_by: null,
  };
}

/** Columns refreshed on re-import: directory metadata only, never anything a person edits. */
const METADATA = ["tier", "firm_group", "firm_contacts", "is_firm_primary", "suggested_rank", "phones_raw", "duplicate_of", "source_raw"] as const;

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
  const sqlOut = process.argv.includes("--sql") ? process.argv[process.argv.indexOf("--sql") + 1] : null;
  const all = parseCsv(readFileSync(FILE, "utf8"));
  const valid = all.filter((r) => r.source_id && (r.name || r.firm));
  const skipped = all.length - valid.length;
  const rows = valid.map(toClient);
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

  const { data: existing, error: exErr } = await supabase.from("clients").select("source_id").not("source_id", "is", null);
  if (exErr) throw exErr;
  const have = new Set((existing ?? []).map((e) => e.source_id as string));
  const fresh = rows.filter((r) => !have.has(r.source_id));
  const old = rows.filter((r) => have.has(r.source_id));

  for (let i = 0; i < fresh.length; i += 100) {
    const { error } = await supabase.from("clients").insert(fresh.slice(i, i + 100));
    if (error) throw error;
  }
  // Existing rows: update directory metadata only (20 at a time).
  for (let i = 0; i < old.length; i += 20) {
    const results = await Promise.all(
      old.slice(i, i + 20).map((r) =>
        supabase.from("clients").update(Object.fromEntries(METADATA.map((c) => [c, r[c]]))).eq("source_id", r.source_id),
      ),
    );
    const failed = results.find((x) => x.error);
    if (failed?.error) throw failed.error;
  }
  console.log(`Rows read: ${all.length}\nInserted: ${fresh.length}\nUpdated (metadata only): ${old.length}\nSkipped: ${skipped}\nFlagged for review: ${flagged}`);
}

main().catch((e) => {
  console.error("Import failed:", e.message ?? e);
  process.exit(1);
});
