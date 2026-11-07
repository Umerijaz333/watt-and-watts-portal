import { formatDate, formatDateTime } from "@/lib/dates";
import type { TimelineItem } from "@/lib/queries";
import { NoteAdminControls } from "@/components/note-admin-controls";

export function Timeline({
  items,
  editable = false,
  large = false,
}: {
  items: TimelineItem[];
  editable?: boolean;
  large?: boolean;
}) {
  if (items.length === 0)
    return (
      <p className={`rounded-lg border border-dashed border-line bg-surface p-4 ${large ? "text-xl text-ink" : "text-muted"}`}>
        No history yet. Add the first note above.
      </p>
    );

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className="card">
          <div className={`mb-2 flex flex-wrap items-center gap-x-2 ${large ? "text-lg text-ink" : "text-sm text-muted"}`}>
            <span className="badge">{item.kind === "note" ? "Note" : "Photo"}</span>
            <span className="font-semibold text-ink">{item.author}</span>
            <span>· {formatDateTime(item.created_at)}</span>
          </div>
          {item.kind === "note" ? (
            editable ? (
              <NoteAdminControls note={item} />
            ) : (
              <NoteBody note={item} large={large} />
            )
          ) : (
            <figure>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption ?? "Photo of notes"} className="max-h-96 w-auto rounded-lg border border-line" loading="lazy" />
                </a>
              ) : (
                <p className="text-sm text-overdue">Image could not be loaded.</p>
              )}
              {item.caption && <figcaption className={`mt-2 ${large ? "text-xl" : ""}`}>{item.caption}</figcaption>}
            </figure>
          )}
        </li>
      ))}
    </ol>
  );
}

export function NoteBody({
  note,
  large = false,
}: {
  note: Extract<TimelineItem, { kind: "note" }>;
  large?: boolean;
}) {
  return (
    <div className={large ? "text-xl" : ""}>
      <p className="whitespace-pre-wrap">{note.body}</p>
      {(note.pending_from_client || note.next_follow_up) && (
        <dl className={`mt-2 space-y-0.5 ${large ? "text-lg text-ink" : "text-sm text-muted"}`}>
          {note.pending_from_client && (
            <div>
              <dt className="inline font-semibold">Pending from client: </dt>
              <dd className="inline">{note.pending_from_client}</dd>
            </div>
          )}
          {note.next_follow_up && (
            <div>
              <dt className="inline font-semibold">Follow-up: </dt>
              <dd className="inline">{formatDate(note.next_follow_up)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
