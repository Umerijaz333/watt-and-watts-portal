"use client";

import Link from "@/components/link";
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
    <header className="sticky top-0 z-10 bg-navy text-paper">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-3 py-2.5 sm:gap-2 sm:px-4">
        <Link href="/" className="mr-1 whitespace-nowrap font-display text-lg font-semibold text-paper sm:mr-2" aria-label="Watt & Watts">
          <span className="sm:hidden">W&amp;W</span>
          <span className="hidden sm:inline">Watt &amp; Watts</span>
        </Link>
        <nav className="flex flex-1 gap-0.5 sm:gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold sm:px-3 ${active(l.href) ? "bg-white/15 text-white underline decoration-link decoration-2 underline-offset-8" : "text-paper/85 hover:bg-white/10"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="flex items-center gap-2">
          <span className="hidden text-sm text-paper/85 sm:inline">{name}</span>
          <button className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold text-paper hover:bg-white/10 sm:px-3">Sign out</button>
        </form>
      </div>
    </header>
  );
}
