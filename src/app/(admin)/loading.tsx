/** Shown instantly on every tap between admin screens while the next one loads. */
export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading">
      <div className="h-9 w-64 animate-pulse rounded-xl bg-white/70" />
      <div className="h-20 animate-pulse rounded-3xl bg-white/70" />
      <div className="h-16 animate-pulse rounded-2xl bg-white/70" />
      <div className="h-16 animate-pulse rounded-2xl bg-white/70" />
    </div>
  );
}
