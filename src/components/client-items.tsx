"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveItem, markItemSent, deleteItem } from "@/app/actions/items";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form-bits";
import { ITEM_KINDS } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/dates";
import { useHydrated } from "@/lib/use-hydrated";
import { useRefreshOnSuccess } from "@/lib/use-refresh";
import type { ClientItem, ItemKind } from "@/lib/types";

const kindInfo = (k: string) => ITEM_KINDS.find((x) => x.value === k) ?? ITEM_KINDS[0];

/** "Orders, sent & received" for one client: grouped list plus add form. */
export function ClientItems({ clientId, items }: { clientId: string; items: ClientItem[] }) {
  const counts = ITEM_KINDS.map((k) => ({ ...k, n: items.filter((i) => i.kind === k.value).length })).filter((k) => k.n);
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="rounded-2xl bg-white/60 p-4 text-muted">
          Nothing recorded yet. Add what they ordered, what we are sending, or what we received from them.
        </p>
      ) : (
        <>
          <p className="flex flex-wrap gap-2 text-sm">
            {counts.map((k) => (
              <span key={k.value} className={`rounded-full px-3 py-0.5 font-semibold ${k.pill}`}>
                {k.n} {k.short.toLowerCase()}
              </span>
            ))}
          </p>
          {ITEM_KINDS.map((k) => {
            const list = items.filter((i) => i.kind === k.value);
            if (!list.length) return null;
            return (
              <div key={k.value}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-navy">{k.label}</h3>
                <ul className="list-card">
                  {list.map((i) => <ItemRow key={i.id} item={i} />)}
                </ul>
              </div>
            );
          })}
        </>
      )}
      <ItemForm clientId={clientId} />
    </div>
  );
}

function ItemRow({ item }: { item: ClientItem }) {
  const router = useRouter();
  const ready = useHydrated();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string>();

  if (editing)
    return (
      <li className="p-3">
        <ItemForm clientId={item.client_id} item={item} onDone={() => setEditing(false)} />
      </li>
    );

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setErr(undefined);
    start(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setErr(res.error ?? "Could not save.");
    });
  };

  return (
    <li className="flex flex-wrap items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {item.description}
          {item.quantity !== null && <span className="ml-2 text-sm font-semibold text-navy">× {item.quantity}</span>}
        </p>
        <p className="text-sm text-muted">
          {item.item_date ? formatDate(item.item_date) : "No date"}
          {item.author?.name ? ` · added by ${item.author.name}` : ""}
        </p>
        {item.notes && <p className="mt-1 text-sm">{item.notes}</p>}
        {err && <p role="alert" className="text-sm text-overdue">{err}</p>}
      </div>
      <div className="flex flex-wrap gap-1">
        {item.kind === "to_send" && (
          <button type="button" disabled={!ready || pending} onClick={() => run(() => markItemSent(item.id))} className="btn bg-done px-3 py-1.5 text-sm text-white">
            {pending ? "Saving…" : "Mark as sent"}
          </button>
        )}
        <button type="button" disabled={!ready || pending} onClick={() => setEditing(true)} className="btn-secondary px-3 py-1.5 text-sm">Edit</button>
        <button
          type="button"
          disabled={!ready || pending}
          className="btn-danger px-3 py-1.5 text-sm"
          onClick={() => {
            if (confirm(`Delete "${item.description}"?`)) run(() => deleteItem(item.id));
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function ItemForm({ clientId, item, onDone }: { clientId: string; item?: ClientItem; onDone?: () => void }) {
  const [state, action, pending] = useActionState(saveItem, null);
  const [kind, setKind] = useState<ItemKind | "">(item?.kind ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  useRefreshOnSuccess(state, () => {
    if (item) onDone?.();
    else {
      formRef.current?.reset();
      setKind("");
    }
  });
  const uid = item?.id ?? "new";

  return (
    <ActionForm ref={formRef} action={action} pending={pending} className={item ? "space-y-3" : "card space-y-3"}>
      {item ? <input type="hidden" name="id" value={item.id} /> : <input type="hidden" name="client_id" value={clientId} />}
      <fieldset>
        <legend className="label">{item ? "Type" : "What are you adding?"}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ITEM_KINDS.map((k) => (
            <label
              key={k.value}
              className={`press cursor-pointer rounded-2xl border-2 px-3 py-2 text-center text-sm font-semibold ${kind === k.value ? "border-btn bg-btn text-white" : "border-tint-strong bg-surface text-navy"}`}
            >
              <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
              {k.label}
            </label>
          ))}
        </div>
        {kind && <p className="mt-1 text-xs text-muted">{kindInfo(kind).hint}</p>}
      </fieldset>
      <div className="grid gap-2 sm:grid-cols-[1fr_6rem_10rem]">
        <div>
          <label className="label" htmlFor={`desc-${uid}`}>What is it? *</label>
          <input id={`desc-${uid}`} name="description" required defaultValue={item?.description ?? ""} placeholder="e.g. Downlight samples, quotation, advance payment" className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`qty-${uid}`}>Qty</label>
          <input id={`qty-${uid}`} name="quantity" type="number" min={0} inputMode="numeric" defaultValue={item?.quantity ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`date-${uid}`}>Date</label>
          <input id={`date-${uid}`} name="item_date" type="date" defaultValue={item ? item.item_date ?? "" : todayISO()} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`notes-${uid}`}>Notes</label>
        <input id={`notes-${uid}`} name="notes" defaultValue={item?.notes ?? ""} placeholder="Optional, e.g. sent with Bilal's driver" className="input" />
      </div>
      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton pendingText="Saving…">{item ? "Save" : "+ Add"}</SubmitButton>
        {item && <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>}
      </div>
    </ActionForm>
  );
}
