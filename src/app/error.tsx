"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md space-y-4 px-5 py-16 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted">{error.message || "The page could not be loaded."}</p>
      <div className="flex justify-center gap-2">
        <button onClick={reset} className="btn-primary">Try again</button>
        <a href="/" className="btn-secondary">Go home</a>
      </div>
    </main>
  );
}
