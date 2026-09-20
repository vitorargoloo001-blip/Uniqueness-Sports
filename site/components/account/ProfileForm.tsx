"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { updateProfileAction } from "@/lib/account";

export default function ProfileForm({
  defaultValues,
  email,
}: {
  defaultValues: ProfileInput;
  email: string;
}) {
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues });

  async function onSubmit(data: ProfileInput) {
    setMessage(null);
    const result = await updateProfileAction(data);
    setMessage(
      result.success
        ? { type: "ok", text: "Dados atualizados." }
        : { type: "error", text: result.error },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4 border border-border bg-surface p-6">
      <div>
        <label className="text-xs uppercase tracking-[0.08em] text-gray">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="mt-1 w-full border border-border bg-[#F7F5F0] px-4 py-3 text-sm text-ink/60"
        />
        <p className="mt-1 text-xs text-gray">
          Pra trocar de email, entre em contato com o suporte.
        </p>
      </div>

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
        <label className="text-xs uppercase tracking-[0.08em] text-gray">Telefone</label>
        <input
          type="text"
          {...register("phone")}
          className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.08em] text-gray">CPF</label>
        <input
          type="text"
          {...register("cpf")}
          className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
        {errors.cpf && <p className="mt-1 text-xs text-red-600">{errors.cpf.message}</p>}
      </div>

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-ink/70" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        {isSubmitting ? "Salvando..." : "Atualizar dados"}
      </button>
    </form>
  );
}
