"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@/lib/generated/prisma/client";
import { deleteAddressAction, setDefaultAddressAction } from "@/lib/account";
import AddressForm from "@/components/account/AddressForm";

export default function AddressList({ addresses }: { addresses: Address[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function remove(id: string) {
    startTransition(async () => {
      await deleteAddressAction(id);
      router.refresh();
    });
  }

  function setDefault(id: string) {
    startTransition(async () => {
      await setDefaultAddressAction(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) =>
        editingId === address.id ? (
          <div key={address.id} className="border border-border bg-surface p-6">
            <AddressForm
              addressId={address.id}
              defaultValues={{
                label: address.label ?? "",
                recipient: address.recipient ?? "",
                phone: address.phone ?? "",
                zipCode: address.zipCode,
                street: address.street,
                number: address.number,
                complement: address.complement ?? "",
                district: address.district,
                city: address.city,
                state: address.state,
                isDefault: address.isDefault,
              }}
              onDone={() => setEditingId(null)}
            />
          </div>
        ) : (
          <div key={address.id} className="border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                {address.isDefault && (
                  <span className="eyebrow bg-ink px-2 py-1 text-[10px] text-white">Padrão</span>
                )}
                <p className="mt-2 font-heading text-sm uppercase text-ink">
                  {address.label || "Endereço"}
                </p>
                <p className="mt-1 text-sm text-ink/80">
                  {address.street}, {address.number}
                  {address.complement ? ` — ${address.complement}` : ""}
                </p>
                <p className="text-sm text-ink/80">
                  {address.district}, {address.city} - {address.state}
                </p>
                <p className="text-sm text-ink/80">CEP {address.zipCode}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 text-right">
                <button
                  type="button"
                  onClick={() => setEditingId(address.id)}
                  className="font-heading text-xs uppercase tracking-[0.1em] text-ink hover:underline"
                >
                  Editar
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setDefault(address.id)}
                    className="font-heading text-xs uppercase tracking-[0.1em] text-ink hover:underline"
                  >
                    Definir padrão
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => remove(address.id)}
                  className="font-heading text-xs uppercase tracking-[0.1em] text-red-600 hover:underline"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <div className="border border-border bg-surface p-6">
          <AddressForm onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="border border-dashed border-border px-6 py-4 font-heading text-xs uppercase tracking-[0.14em] text-ink hover:border-ink"
        >
          + Adicionar novo endereço
        </button>
      )}
    </div>
  );
}
