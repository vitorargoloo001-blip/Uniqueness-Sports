import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: { template: "%s — Admin", default: "Painel administrativo" },
  ...NOINDEX,
};

const NAV = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/cupons", label: "Cupons" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <section className="px-5 py-14 md:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow text-xs text-gray">Painel administrativo</p>
        <h1 className="mt-2 font-display text-4xl uppercase text-ink md:text-5xl">
          Admin
        </h1>

        <div className="mt-10 grid gap-10 md:grid-cols-[220px_1fr]">
          <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap border border-border px-4 py-3 font-heading text-xs uppercase tracking-[0.1em] text-ink/80 hover:border-ink hover:text-ink md:whitespace-normal"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div>{children}</div>
        </div>
      </div>
    </section>
  );
}
