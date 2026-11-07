"use client";

import Link from "@/components/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

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
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
        <Link href="/" className="mr-2 text-paper" aria-label="Watt & Watts home">
          <Logo size={24} className="[&>span]:hidden sm:[&>span]:inline" />
        </Link>
        <nav className="flex flex-1 gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${active(l.href) ? "bg-white/15 text-white underline decoration-link decoration-2 underline-offset-8" : "text-paper/85 hover:bg-white/10"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="flex items-center gap-2">
          <span className="hidden text-sm text-paper/85 sm:inline">{name}</span>
          <button className="rounded-lg px-3 py-2 text-sm font-semibold text-paper hover:bg-white/10">Sign out</button>
        </form>
      </div>
    </header>
  );
}
