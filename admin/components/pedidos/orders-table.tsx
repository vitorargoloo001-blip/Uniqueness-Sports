"use client";

import Link from "next/link";
import { createColumns, DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_VARIANT } from "@/lib/status";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: Date;
  _count: { items: number };
};

const columnHelper = createColumns<Order>();

export function OrdersTable({ orders }: { orders: Order[] }) {
  const columns = columnHelper.columns([
    columnHelper.accessor("orderNumber", {
      header: "Pedido",
      cell: (info) => (
        <Link href={`/pedidos/${info.row.original.id}`} className="font-medium text-foreground hover:underline">
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor("customerName", {
      header: "Cliente",
      cell: (info) => (
        <div>
          <div className="text-foreground">{info.getValue()}</div>
          <div className="text-xs text-muted-foreground">{info.row.original.customerEmail}</div>
        </div>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <StatusBadge
          label={ORDER_STATUS_LABELS[info.getValue()] ?? info.getValue()}
          variant={ORDER_STATUS_VARIANT[info.getValue()] ?? "neutral"}
        />
      ),
    }),
    columnHelper.accessor("paymentStatus", {
      header: "Pagamento",
      cell: (info) => (
        <StatusBadge
          label={PAYMENT_STATUS_LABELS[info.getValue()] ?? info.getValue()}
          variant={PAYMENT_STATUS_VARIANT[info.getValue()] ?? "neutral"}
        />
      ),
    }),
    columnHelper.accessor("total", {
      header: "Total",
      cell: (info) => formatPrice(Number(info.getValue())),
    }),
    columnHelper.accessor("createdAt", {
      header: "Data",
      cell: (info) => formatDateTime(info.getValue()),
    }),
  ]);

  return <DataTable columns={columns} data={orders} searchPlaceholder="Buscar por número, cliente..." />;
}
