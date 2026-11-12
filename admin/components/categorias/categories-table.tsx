"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { CategoryForm } from "@/components/categorias/category-form";
import { deleteCategoryAction } from "@/lib/categories-actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  _count: { products: number };
};

const columnHelper = createColumns<Category>();

export function CategoriesTable({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const result = await deleteCategoryAction(deleting.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Categoria excluída");
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
      header: "Nome",
      cell: (info) => <span className="font-medium text-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor("slug", {
      header: "Slug",
      cell: (info) => <span className="text-muted-foreground">/{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => row._count.products, {
      id: "productCount",
      header: "Produtos",
      cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge>,
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
            <DropdownMenuItem onSelect={() => handleEdit(row.original)}>
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
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          Nova categoria
        </Button>
      </div>

      <DataTable columns={columns} data={categories} searchPlaceholder="Buscar categoria..." />

      <CategoryForm open={formOpen} onOpenChange={setFormOpen} category={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting._count.products > 0
                ? `"${deleting.name}" tem ${deleting._count.products} produto(s) vinculado(s). Eles ficarão sem categoria — não serão excluídos.`
                : `Tem certeza que quer excluir "${deleting?.name}"? Essa ação não pode ser desfeita.`}
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
