"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/status-badge";
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
import { ProductForm } from "@/components/produtos/product-form";
import { formatPrice } from "@/lib/format";
import { deleteProductAction, toggleProductActiveAction } from "@/lib/products-actions";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number | string;
  compareAtPrice: number | string | null;
  sku: string | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  weightGrams: number | null;
  unitsPerBox: number | null;
  heightCm: number | null;
  widthCm: number | null;
  lengthCm: number | null;
};

const columnHelper = createColumns<Product>();

export function ProductsTable({
  products,
  categories,
}: {
  products: Product[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleToggleActive(id: string) {
    const result = await toggleProductActiveAction(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const result = await deleteProductAction(deleting.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Produto excluído");
    setDeleting(null);
    router.refresh();
  }

  const columns = columnHelper.columns([
    columnHelper.accessor("imageUrl", {
      header: "",
      enableSorting: false,
      cell: (info) => (
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-secondary">
          {info.getValue() ? (
            <Image src={info.getValue()!} alt="" width={40} height={40} className="size-10 object-cover" />
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("name", {
      header: "Produto",
      cell: (info) => (
        <div>
          <div className="font-medium text-foreground">{info.getValue()}</div>
          {info.row.original.sku && (
            <div className="text-xs text-muted-foreground">SKU {info.row.original.sku}</div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.category?.name ?? "—", {
      id: "category",
      header: "Categoria",
    }),
    columnHelper.accessor("price", {
      header: "Preço",
      cell: (info) => formatPrice(Number(info.getValue())),
    }),
    columnHelper.accessor("stock", {
      header: "Estoque",
      cell: (info) => {
        const stock = info.getValue();
        return (
          <StatusBadge
            label={`${stock} un.`}
            variant={stock === 0 ? "danger" : stock <= 10 ? "warning" : "neutral"}
          />
        );
      },
    }),
    columnHelper.accessor("isActive", {
      header: "Ativo",
      cell: (info) => (
        <Switch checked={info.getValue()} onCheckedChange={() => handleToggleActive(info.row.original.id)} />
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
          Novo produto
        </Button>
      </div>

      <DataTable columns={columns} data={products} searchPlaceholder="Buscar produto..." />

      <ProductForm open={formOpen} onOpenChange={setFormOpen} product={editing} categories={categories} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que quer excluir &quot;{deleting?.name}&quot;? Se ele já foi vendido, o histórico de
              pedidos é mantido, mas se estiver em algum carrinho ativo a exclusão será bloqueada — nesse caso,
              desative-o.
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
