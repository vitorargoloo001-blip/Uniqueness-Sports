"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { formatDate } from "@/lib/format";
import { adminUserSchema, type AdminUserInput } from "@/lib/validations";
import { createAdminUserAction, revokeAdminAction } from "@/lib/admin-users-actions";

type AdminUser = { id: string; name: string | null; email: string; createdAt: Date };

function NewAdminDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminUserInput>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(data: AdminUserInput) {
    const result = await createAdminUserAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Administrador adicionado");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Adicionar administrador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo administrador</DialogTitle>
          <DialogDescription>
            Cria um login com acesso total ao painel. Se o email já for cliente da loja, a conta existente vira
            administradora.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="admin-name">Nome</FieldLabel>
              <Input id="admin-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="admin-email">Email</FieldLabel>
              <Input id="admin-email" type="email" {...register("email")} />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="admin-password">Senha provisória</FieldLabel>
              <Input id="admin-password" type="text" {...register("password")} />
              <FieldError errors={[errors.password]} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Criar acesso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminTeam({ admins }: { admins: AdminUser[] }) {
  const router = useRouter();
  const [revoking, setRevoking] = useState<AdminUser | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  async function handleRevoke() {
    if (!revoking) return;
    setIsRevoking(true);
    const result = await revokeAdminAction(revoking.id);
    setIsRevoking(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Acesso removido");
    setRevoking(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Equipe (acesso administrativo)</CardTitle>
        <NewAdminDialog />
      </CardHeader>
      <CardContent className="space-y-2">
        {admins.map((admin) => (
          <div key={admin.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
            <div>
              <div className="font-medium text-foreground">{admin.name ?? admin.email}</div>
              <div className="text-xs text-muted-foreground">
                {admin.email} · admin desde {formatDate(admin.createdAt)}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setRevoking(admin)} className="text-status-danger-fg">
              <UserMinus className="size-4" />
            </Button>
          </div>
        ))}
      </CardContent>

      <AlertDialog open={!!revoking} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso de administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{revoking?.name ?? revoking?.email}&quot; deixa de ter acesso ao painel. A conta continua existindo
              como cliente comum.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} disabled={isRevoking}>
              Remover acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
