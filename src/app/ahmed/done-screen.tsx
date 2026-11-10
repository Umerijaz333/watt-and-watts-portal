import Link from "@/components/link";
import { CheckIcon } from "@/components/icons";

export function DoneScreen({ title, detail, again }: { title: string; detail?: string; again: { href: string; label: string } }) {
  return (
    <div className="animate-fade-up space-y-6 py-6 text-center" role="status">
      <div className="animate-pop mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-done text-white shadow-soft"><CheckIcon size={56} /></div>
      <div>
        <p className="font-display text-3xl font-bold text-navy">{title}</p>
        {detail && <p className="mt-2 text-xl">{detail}</p>}
      </div>
      <Link href="/ahmed" className="btn-primary w-full py-5 text-2xl">Back to home</Link>
      <a href={again.href} className="btn-secondary w-full py-4 text-xl">{again.label}</a>
    </div>
  );
}
