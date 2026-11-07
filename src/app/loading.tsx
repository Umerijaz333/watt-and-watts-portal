export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-brand" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
