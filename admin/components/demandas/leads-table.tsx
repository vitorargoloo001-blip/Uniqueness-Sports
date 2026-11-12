"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { DataTable, createColumns } from "@/components/data-table";
import { deleteLeadAction, updateLeadStatusAction } from "@/lib/leads-actions";
import { formatDateTime } from "@/lib/format";
import { LEAD_STATUS_LABELS, LEAD_STATUS_VARIANT } from "@/lib/status";
import type { LeadStatus } from "@/lib/generated/prisma/client";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: LeadStatus;
  source: string | null;
  createdAt: Date;
};

const columnHelper = createColumns<Lead>();
const STATUSES = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [viewing, setViewing] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleStatusChange(id: string, status: LeadStatus) {
    const result = await updateLeadStatusAction(id, status);
    if (!result.success) toast.error(result.error);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const result = await deleteLeadAction(deleting.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Demanda removida");
    setDeleting(null);
    router.refresh();
  }

  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Nome",
      cell: (info) => (
        <button className="text-left font-medium text-foreground hover:underline" onClick={() => setViewing(info.row.original)}>
          {info.getValue()}
        </button>
      ),
    }),
    columnHelper.accessor("email", { header: "Contato" }),
    columnHelper.accessor((row) => row.source ?? "—", { id: "source", header: "Origem" }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <Select value={info.getValue()} onValueChange={(v) => handleStatusChange(info.row.original.id, v as LeadStatus)}>
          <SelectTrigger className="h-8 w-40 border-none bg-transparent p-0 shadow-none focus-visible:ring-0">
            <StatusBadge label={LEAD_STATUS_LABELS[info.getValue()]} variant={LEAD_STATUS_VARIANT[info.getValue()]} />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Recebida em",
      cell: (info) => formatDateTime(info.getValue()),
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
            <DropdownMenuItem onSelect={() => setViewing(row.original)}>Ver mensagem</DropdownMenuItem>
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
      <DataTable columns={columns} data={leads} searchPlaceholder="Buscar demanda..." />

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription>
              {viewing?.email}
              {viewing?.phone ? ` · ${viewing.phone}` : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm text-foreground">{viewing?.message}</p>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir demanda?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
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
