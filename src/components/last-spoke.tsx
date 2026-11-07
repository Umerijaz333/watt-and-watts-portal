import { formatDateTime } from "@/lib/dates";

/** "Last time we spoke" summary: latest note and what is pending from the client. */
export function LastSpoke({
  note,
  pending,
  large = false,
}: {
  note: { body: string; created_at: string; author: string } | undefined;
  pending: string | null;
  large?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-tint-strong bg-tint p-4 ${large ? "text-xl" : ""}`}>
      <p className={`font-display font-bold text-navy ${large ? "text-xl" : "text-sm uppercase tracking-wide"}`}>Last time we spoke</p>
      {note ? (
        <>
          <p className="mt-1 whitespace-pre-wrap">{note.body}</p>
          <p className={`mt-1 ${large ? "text-lg" : "text-sm text-muted"}`}>{formatDateTime(note.created_at)} · {note.author}</p>
        </>
      ) : (
        <p className="mt-1">No notes yet.</p>
      )}
      {pending && (
        <p className="mt-2">
          <span className="font-semibold text-navy">Waiting on client: </span>
          {pending}
        </p>
      )}
    </div>
  );
}
