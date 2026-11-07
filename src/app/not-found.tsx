import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md space-y-4 px-5 py-16 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="text-muted">This page or client does not exist.</p>
      <Link href="/" className="btn-primary">Go home</Link>
    </main>
  );
}
