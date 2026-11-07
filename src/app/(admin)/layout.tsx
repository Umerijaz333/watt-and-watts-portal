import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  return (
    <>
      <AdminNav name={profile.name} />
      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
    </>
  );
}
