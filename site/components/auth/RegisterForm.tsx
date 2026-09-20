"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { registerAction } from "@/lib/auth-actions";

export default function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const result = await registerAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    router.push("/minha-conta");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <div>
        <label className="text-xs uppercase tracking-[0.08em] text-gray">Nome completo</label>
        <input
          type="text"
          {...register("name")}
          className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

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
        {isSubmitting ? "Criando..." : "Criar conta"}
      </button>

      <p className="text-center text-sm text-gray">
        Já tem conta?{" "}
        <Link href="/login" className="text-ink underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
