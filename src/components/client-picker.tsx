"use client";

import { useMemo, useState, useTransition } from "react";
import { quickCreateClient } from "@/app/actions/clients";

export type ClientOption = { id: string; name: string; firm: string | null };

/** Big, phone-friendly searchable client chooser with inline "+ New client" (name + phone). */
export function ClientPicker({
  clients: initial,
  value,
  onChange,
}: {
  clients: ClientOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [clients, setClients] = useState(initial);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const selected = clients.find((c) => c.id === value) ?? null;
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? clients.filter((c) => `${c.name} ${c.firm ?? ""}`.toLowerCase().includes(q)) : clients;
    return list.slice(0, 8);
  }, [clients, query]);

  if (selected)
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-brand bg-amber-50 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-bold">{selected.name}</p>
          {selected.firm && <p className="truncate text-lg text-muted">{selected.firm}</p>}
        </div>
        <button type="button" className="btn-secondary px-4 py-3 text-lg" onClick={() => onChange(null)}>Change</button>
        <input type="hidden" name="client_id" value={selected.id} />
      </div>
    );

  if (creating)
    return (
      <div className="space-y-3 rounded-xl border-2 border-gray-400 bg-white p-4">
        <p className="text-xl font-bold">New client</p>
        <div>
          <label className="mb-1 block text-xl font-semibold" htmlFor="new-client-name">Name *</label>
          <input id="new-client-name" value={newName} onChange={(e) => setNewName(e.target.value)} className="input py-4 text-xl" autoFocus />
        </div>
        <div>
          <label className="mb-1 block text-xl font-semibold" htmlFor="new-client-phone">Phone</label>
          <input id="new-client-phone" type="tel" inputMode="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="input py-4 text-xl" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xl font-medium text-red-800">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            className="btn-primary flex-1 py-4 text-xl"
            onClick={() => {
              setError(undefined);
              if (!newName.trim()) return setError("Please enter the client's name.");
              start(async () => {
                const res = await quickCreateClient(newName, newPhone);
                if (!res.ok) return setError(res.error);
                const c = { id: res.id, name: res.name, firm: null };
                setClients((prev) => [c, ...prev]);
                setCreating(false);
                setNewName("");
                setNewPhone("");
                onChange(c.id);
              });
            }}
          >
            {pending ? "Adding…" : "Add client"}
          </button>
          <button type="button" className="btn-secondary px-5 py-4 text-xl" onClick={() => setCreating(false)}>Cancel</button>
        </div>
      </div>
    );

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type client name…"
        className="input py-4 text-xl"
        aria-label="Search client"
      />
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-gray-400 bg-white">
        {matches.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onChange(c.id)} className="block w-full px-4 py-4 text-left hover:bg-amber-50 active:bg-amber-100">
              <span className="block text-xl font-semibold">{c.name}</span>
              {c.firm && <span className="block text-lg text-muted">{c.firm}</span>}
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className="px-4 py-4 text-lg text-muted">No client found{query ? ` for “${query}”` : ""}.</li>}
      </ul>
      <button
        type="button"
        onClick={() => {
          setCreating(true);
          setNewName(query.trim());
        }}
        className="btn-secondary w-full border-2 border-dashed py-4 text-xl"
      >
        + New client
      </button>
    </div>
  );
}
