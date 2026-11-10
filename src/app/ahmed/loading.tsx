/** Shown instantly on every tap between Ahmed's screens while the next one loads. */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <div className="h-14 w-14 animate-spin rounded-full border-[5px] border-tint-strong border-t-btn" />
      <p className="text-xl font-semibold text-navy">Loading…</p>
    </div>
  );
}
