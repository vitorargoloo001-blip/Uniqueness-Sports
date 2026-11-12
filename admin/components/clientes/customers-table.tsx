"use client";

import Link from "next/link";
import { createColumns, DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";

type Customer = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: Date;
  ordersCount: number;
  totalSpent: number;
};

const columnHelper = createColumns<Customer>();

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const columns = columnHelper.columns([
    columnHelper.accessor((row) => row.name ?? row.email, {
      id: "name",
      header: "Cliente",
      cell: (info) => (
        <Link href={`/clientes/${info.row.original.id}`} className="font-medium text-foreground hover:underline">
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor("email", { header: "Email" }),
    columnHelper.accessor((row) => row.phone ?? "—", { id: "phone", header: "Telefone" }),
    columnHelper.accessor("ordersCount", {
      header: "Pedidos",
      cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge>,
    }),
    columnHelper.accessor("totalSpent", {
      header: "Total gasto",
      cell: (info) => formatPrice(info.getValue()),
    }),
    columnHelper.accessor("createdAt", {
      header: "Cliente desde",
      cell: (info) => formatDate(info.getValue()),
    }),
  ]);

  return <DataTable columns={columns} data={customers} searchPlaceholder="Buscar cliente..." />;
}
