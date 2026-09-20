import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta Uniqueness Sports e acompanhe seus pedidos.",
  ...NOINDEX,
};

export default function CadastroPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 py-16 md:px-8">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-xs text-gray">Bem-vindo</p>
        <h1 className="mt-2 font-display text-3xl uppercase text-ink">Criar conta</h1>
        <RegisterForm />
      </div>
    </section>
  );
}
