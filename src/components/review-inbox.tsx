"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/link";
import { markReviewed, markAllReviewed, type ReviewKind } from "@/app/actions/review";
import { formatDateTime } from "@/lib/dates";
import { useHydrated } from "@/lib/use-hydrated";
import type { InboxItem } from "@/lib/queries";

const KIND_LABEL: Record<ReviewKind, string> = { note: "Note", photo: "Photo", client: "New client" };

export function ReviewInbox({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const ready = useHydrated();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [, start] = useTransition();
  const visible = items.filter((i) => !hidden.has(i.kind + i.id));

  const review = (item: InboxItem) => {
    setError(undefined);
    setBusy(item.kind + item.id);
    start(async () => {
      const res = await markReviewed(item.kind, item.id);
      setBusy(null);
      if (res.ok) setHidden((h) => new Set(h).add(item.kind + item.id));
      else setError(res.error ?? "Could not save.");
    });
  };

  const reviewAll = () => {
    setError(undefined);
    setBusy("all");
    start(async () => {
      const res = await markAllReviewed();
      setBusy(null);
      if (res.ok) {
        setHidden(new Set(items.map((i) => i.kind + i.id)));
        router.refresh();
      } else setError(res.error ?? "Could not save.");
    });
  };

  if (visible.length === 0) return <p className="card text-muted">All caught up. Nothing new to review.</p>;

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {visible.map((i) => (
          <li key={i.kind + i.id} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted">
                <span className="badge mr-1 border-tint-strong bg-tint text-navy">{KIND_LABEL[i.kind]}</span>
                {i.author} · {formatDateTime(i.created_at)}
              </p>
              {i.client && (
                <Link href={`/clients/${i.client.id}`} className="font-semibold text-link underline">{i.client.name}</Link>
              )}
              <p className="line-clamp-2 text-sm">{i.text}</p>
            </div>
            <button
              type="button"
              disabled={!ready || busy !== null}
              onClick={() => review(i)}
              className="btn-secondary shrink-0 px-3 py-1.5 text-sm"
            >
              {busy === i.kind + i.id ? "Saving…" : "Reviewed"}
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-sm text-overdue">{error}</p>}
      {visible.length > 1 && (
        <button type="button" disabled={!ready || busy !== null} onClick={reviewAll} className="btn-secondary text-sm">
          {busy === "all" ? "Saving…" : `Mark all ${visible.length} reviewed`}
        </button>
      )}
    </div>
  );
}
