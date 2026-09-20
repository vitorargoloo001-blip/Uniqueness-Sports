"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { loginAction } from "@/lib/auth-actions";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const result = await loginAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/minha-conta");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <div>
        <label className="text-xs uppercase tracking-[0.08em] text-gray">Email</label>
        <input
          type="email"
          {...register("email")}
          className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.08em] text-gray">Senha</label>
        <input
          type="password"
          {...register("password")}
          className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-sm text-gray">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-ink underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
