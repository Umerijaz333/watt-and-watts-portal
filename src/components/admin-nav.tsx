"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/tasks", label: "Tasks" },
];

export function AdminNav({ name }: { name: string }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
        <Link href="/" className="mr-2 flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">W</span>
          <span className="hidden sm:inline">Watt &amp; Watts</span>
        </Link>
        <nav className="flex flex-1 gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${active(l.href) ? "bg-amber-100 text-brand-dark" : "text-muted hover:bg-gray-100"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="flex items-center gap-2">
          <span className="hidden text-sm text-muted sm:inline">{name}</span>
          <button className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-gray-100">Sign out</button>
        </form>
      </div>
    </header>
  );
}
