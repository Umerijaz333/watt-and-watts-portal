import { formatDate, formatDateTime } from "@/lib/dates";
import type { TimelineItem } from "@/lib/queries";
import { NoteAdminControls } from "@/components/note-admin-controls";
import { Avatar } from "@/components/avatar";

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
      <p className={`rounded-2xl bg-white/60 p-4 ${large ? "text-xl text-ink" : "text-muted"}`}>
        Nothing written down yet. Add the first note above.
      </p>
    );

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className="card">
          <div className={`mb-2 flex flex-wrap items-center gap-x-2 ${large ? "text-lg text-ink" : "text-sm text-muted"}`}>
            <Avatar name={item.author} size={large ? 36 : 30} />
            <span>
              <span className="font-semibold text-ink">{item.author}</span>{" "}
              {item.kind === "note" ? "wrote a note" : "added a photo"} · {formatDateTime(item.created_at)}
            </span>
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
                  <img src={item.url} alt={item.caption ?? "Photo of notes"} className="max-h-96 w-auto rounded-xl" loading="lazy" />
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
              <dt className="inline font-semibold">Waiting on client: </dt>
              <dd className="inline">{note.pending_from_client}</dd>
            </div>
          )}
          {note.next_follow_up && (
            <div>
              <dt className="inline font-semibold">Call again: </dt>
              <dd className="inline">{formatDate(note.next_follow_up)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
