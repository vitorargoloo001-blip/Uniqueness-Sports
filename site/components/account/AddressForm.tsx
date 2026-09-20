"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { addressInputSchema, type AddressInput } from "@/lib/validations";
import { addAddressAction, updateAddressAction } from "@/lib/account";

const FIELDS: { name: keyof AddressInput; label: string; span?: string }[] = [
  { name: "label", label: "Apelido (ex: Casa, Trabalho)", span: "sm:col-span-2" },
  { name: "recipient", label: "Destinatário" },
  { name: "phone", label: "Telefone" },
  { name: "zipCode", label: "CEP" },
  { name: "street", label: "Rua", span: "sm:col-span-2" },
  { name: "number", label: "Número" },
  { name: "complement", label: "Complemento" },
  { name: "district", label: "Bairro" },
  { name: "city", label: "Cidade" },
  { name: "state", label: "UF" },
];

export default function AddressForm({
  addressId,
  defaultValues,
  onDone,
}: {
  addressId?: string;
  defaultValues?: Partial<AddressInput>;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressInputSchema),
    defaultValues,
  });

  async function onSubmit(data: AddressInput) {
    setServerError(null);
    const result = addressId
      ? await updateAddressAction(addressId, data)
      : await addAddressAction(data);

    if (!result.success) {
      setServerError(result.error);
      return;
    }
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <div key={field.name} className={field.span}>
          <label className="text-xs uppercase tracking-[0.08em] text-gray">{field.label}</label>
          <input
            type="text"
            {...register(field.name)}
            className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
          />
          {errors[field.name] && (
            <p className="mt-1 text-xs text-red-600">{errors[field.name]?.message}</p>
          )}
        </div>
      ))}

      <label className="flex items-center gap-2 text-sm text-ink/80 sm:col-span-2">
        <input type="checkbox" {...register("isDefault")} className="h-4 w-4" />
        Definir como endereço padrão
      </label>

      {serverError && (
        <p className="text-sm text-red-600 sm:col-span-2">{serverError}</p>
      )}

      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {isSubmitting ? "Salvando..." : addressId ? "Salvar endereço" : "Adicionar endereço"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="border border-border px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-ink hover:border-ink"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
