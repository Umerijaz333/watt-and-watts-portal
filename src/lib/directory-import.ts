import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared directory import logic, used by scripts/import-architects.ts and the in-app
 * "Import architect list" button. Idempotent: rows match on source_id; existing rows only get
 * directory metadata refreshed and never lose edited names, phones, stages, notes, picks or summaries.
 */

/** Minimal RFC 4180 CSV parser (quoted fields, commas and newlines inside quotes). */
export function parseCsv(text: string): Record<string, string>[] {
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

export const nul = (s: string) => (s === "" ? null : s);
export const int = (s: string) => (s === "" || Number.isNaN(Number(s)) ? null : Number.parseInt(s, 10));

export type Row = Record<string, string>;

/** Full row for a new client. */
export function toClient(r: Row) {
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
export const METADATA = ["tier", "firm_group", "firm_contacts", "is_firm_primary", "suggested_rank", "phones_raw", "duplicate_of", "source_raw"] as const;


export const REQUIRED_COLUMNS = ["source_id", "name", "firm", "is_firm_primary", "tier", "firm_group"];

export type ImportSummary = { read: number; inserted: number; updated: number; skipped: number; flagged: number };

/** Parse CSV text into client rows; throws a readable error if it is not the directory file. */
export function prepareRows(text: string) {
  const all = parseCsv(text);
  if (!all.length) throw new Error("The file is empty.");
  const missing = REQUIRED_COLUMNS.filter((c) => !(c in all[0]));
  if (missing.length) throw new Error(`This doesn't look like the architect directory file (missing columns: ${missing.join(", ")}).`);
  const valid = all.filter((r) => r.source_id && (r.name || r.firm));
  return { all, rows: valid.map(toClient), skipped: all.length - valid.length };
}

/** Insert new rows and refresh metadata on existing ones. */
export async function importRows(supabase: SupabaseClient, text: string): Promise<ImportSummary> {
  const { all, rows, skipped } = prepareRows(text);
  const { data: existing, error: exErr } = await supabase.from("clients").select("source_id").not("source_id", "is", null);
  if (exErr) throw exErr;
  const have = new Set((existing ?? []).map((e) => e.source_id as string));
  const fresh = rows.filter((r) => !have.has(r.source_id));
  const old = rows.filter((r) => have.has(r.source_id));
  for (let i = 0; i < fresh.length; i += 100) {
    const { error } = await supabase.from("clients").insert(fresh.slice(i, i + 100));
    if (error) throw error;
  }
  for (let i = 0; i < old.length; i += 20) {
    const results = await Promise.all(
      old.slice(i, i + 20).map((r) =>
        supabase.from("clients").update(Object.fromEntries(METADATA.map((c) => [c, r[c]]))).eq("source_id", r.source_id),
      ),
    );
    const failed = results.find((x) => x.error);
    if (failed?.error) throw failed.error;
  }
  return { read: all.length, inserted: fresh.length, updated: old.length, skipped, flagged: rows.filter((r) => r.needs_review).length };
}
