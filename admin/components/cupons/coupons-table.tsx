"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable, createColumns } from "@/components/data-table";
import { CouponForm } from "@/components/cupons/coupon-form";
import { deleteCouponAction, toggleCouponActiveAction } from "@/lib/coupons-actions";
import { formatDate, formatPrice } from "@/lib/format";
import { DISCOUNT_TYPE_LABELS } from "@/lib/status";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number | string;
  minOrderValue: number | string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  productId: string | null;
  categoryId: string | null;
  product: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
};

const columnHelper = createColumns<Coupon>();

export function CouponsTable({
  coupons,
  products,
  categories,
}: {
  coupons: Coupon[];
  products: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleToggle(id: string) {
    const result = await toggleCouponActiveAction(id);
    if (!result.success) toast.error(result.error);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const result = await deleteCouponAction(deleting.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Cupom excluído");
    setDeleting(null);
    router.refresh();
  }

  const columns = columnHelper.columns([
    columnHelper.accessor("code", {
      header: "Código",
      cell: (info) => <span className="font-mono font-medium text-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => (row.type === "PERCENT" ? `${Number(row.value)}%` : formatPrice(Number(row.value))), {
      id: "value",
      header: "Desconto",
      cell: (info) => (
        <div>
          <div className="text-foreground">{info.getValue()}</div>
          <div className="text-xs text-muted-foreground">{DISCOUNT_TYPE_LABELS[info.row.original.type]}</div>
        </div>
      ),
    }),
    columnHelper.accessor(
      (row) => row.product?.name ?? row.category?.name ?? "Loja inteira",
      {
        id: "scope",
        header: "Aplicação",
        cell: (info) => (
          <span className={info.row.original.product || info.row.original.category ? "text-foreground" : "text-muted-foreground"}>
            {info.getValue()}
          </span>
        ),
      },
    ),
    columnHelper.accessor("usedCount", {
      header: "Usos",
      cell: (info) => (
        <Badge variant="secondary">
          {info.getValue()}
          {info.row.original.maxUses ? ` / ${info.row.original.maxUses}` : ""}
        </Badge>
      ),
    }),
    columnHelper.accessor((row) => (row.expiresAt ? formatDate(row.expiresAt) : "Sem validade"), {
      id: "expiresAt",
      header: "Validade",
    }),
    columnHelper.accessor("isActive", {
      header: "Ativo",
      cell: (info) => (
        <Switch checked={info.getValue()} onCheckedChange={() => handleToggle(info.row.original.id)} />
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                setEditing(row.original);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(row.original)}>
              <Trash2 className="size-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Novo cupom
        </Button>
      </div>

      <DataTable columns={columns} data={coupons} searchPlaceholder="Buscar cupom..." />

      <CouponForm
        open={formOpen}
        onOpenChange={setFormOpen}
        coupon={editing}
        products={products}
        categories={categories}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que quer excluir &quot;{deleting?.code}&quot;? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
