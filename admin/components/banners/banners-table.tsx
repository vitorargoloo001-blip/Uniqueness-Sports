"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { BannerForm } from "@/components/banners/banner-form";
import { deleteBannerAction, toggleBannerActiveAction } from "@/lib/banners-actions";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  position: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

const columnHelper = createColumns<Banner>();

export function BannersTable({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleToggle(id: string) {
    const result = await toggleBannerActiveAction(id);
    if (!result.success) toast.error(result.error);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const result = await deleteBannerAction(deleting.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Banner excluído");
    setDeleting(null);
    router.refresh();
  }

  const columns = columnHelper.columns([
    columnHelper.accessor("imageUrl", {
      header: "",
      enableSorting: false,
      cell: (info) => (
        <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-md bg-secondary">
          <Image src={info.getValue()} alt="" width={64} height={40} className="h-10 w-16 object-cover" />
        </div>
      ),
    }),
    columnHelper.accessor("title", {
      header: "Título",
      cell: (info) => (
        <div>
          <div className="font-medium text-foreground">{info.getValue()}</div>
          {info.row.original.linkUrl && (
            <div className="text-xs text-muted-foreground">{info.row.original.linkUrl}</div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("position", { header: "Ordem" }),
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
          Novo banner
        </Button>
      </div>

      <DataTable columns={columns} data={banners} searchPlaceholder="Buscar banner..." />

      <BannerForm open={formOpen} onOpenChange={setFormOpen} banner={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que quer excluir &quot;{deleting?.title}&quot;? Essa ação não pode ser desfeita.
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
