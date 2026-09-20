"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { toggleProductActiveAction, updateStockAction } from "@/lib/admin";

type Row = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  category: { name: string } | null;
};

export default function ProductsTable({ products }: { products: Row[] }) {
  const [isPending, startTransition] = useTransition();
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const router = useRouter();

  function toggleActive(id: string) {
    startTransition(async () => {
      await toggleProductActiveAction(id);
      router.refresh();
    });
  }

  function saveStock(id: string) {
    const value = Number(stockDrafts[id]);
    if (Number.isNaN(value)) return;
    startTransition(async () => {
      await updateStockAction(id, value);
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-gray">
            <th className="p-4">Produto</th>
            <th className="p-4">Categoria</th>
            <th className="p-4">Preço</th>
            <th className="p-4">Estoque</th>
            <th className="p-4">Status</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="p-4 font-heading text-ink">{product.name}</td>
              <td className="p-4 text-ink/70">{product.category?.name ?? "—"}</td>
              <td className="p-4 text-ink/70">{formatPrice(product.price)}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    defaultValue={product.stock}
                    onChange={(e) =>
                      setStockDrafts((s) => ({ ...s, [product.id]: e.target.value }))
                    }
                    className="w-20 border border-border px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => saveStock(product.id)}
                    className="text-xs uppercase text-ink hover:underline"
                  >
                    Salvar
                  </button>
                </div>
              </td>
              <td className="p-4">
                <span
                  className={`text-xs uppercase ${
                    product.isActive ? "text-ink" : "text-gray"
                  }`}
                >
                  {product.isActive ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="p-4 text-right">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => toggleActive(product.id)}
                  className="font-heading text-xs uppercase tracking-[0.08em] text-ink hover:underline"
                >
                  {product.isActive ? "Desativar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
