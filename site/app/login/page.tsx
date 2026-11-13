import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta Uniqueness Sports.",
  ...NOINDEX,
};

export default function LoginPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 py-16 md:px-8">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-xs text-gray">Bem-vindo de volta</p>
        <h1 className="mt-2 font-display text-3xl uppercase text-ink">Entrar</h1>
        {/* LoginForm usa useSearchParams — sem Suspense o build quebra quando o Next pré-renderiza /login. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
