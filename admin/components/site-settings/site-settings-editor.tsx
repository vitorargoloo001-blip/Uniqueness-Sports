"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { siteSettingSchema, type SiteSettingInput } from "@/lib/validations";
import {
  createSiteSettingAction,
  updateSiteSettingValueAction,
  deleteSiteSettingAction,
} from "@/lib/site-settings-actions";

type Setting = { id: string; key: string; value: string; label: string; group: string };

function SettingRow({ setting }: { setting: Setting }) {
  const router = useRouter();
  const [value, setValue] = useState(setting.value);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dirty = value !== setting.value;
  const multiline = setting.value.length > 60 || setting.value.includes("\n");

  async function handleSave() {
    setIsSaving(true);
    const result = await updateSiteSettingValueAction(setting.id, value);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Salvo");
    router.refresh();
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteSiteSettingAction(setting.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Configuração removida");
    router.refresh();
  }

  return (
    <div className="space-y-1.5 border-b border-border py-3 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={setting.id} className="text-sm">
          {setting.label}
        </FieldLabel>
        <span className="font-mono text-[11px] text-muted-foreground">{setting.key}</span>
      </div>
      <div className="flex items-start gap-2">
        {multiline ? (
          <Textarea id={setting.id} value={value} onChange={(e) => setValue(e.target.value)} rows={3} />
        ) : (
          <Input id={setting.id} value={value} onChange={(e) => setValue(e.target.value)} />
        )}
        <Button size="icon" variant="outline" onClick={handleSave} disabled={!dirty || isSaving} className="shrink-0">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : "OK"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDelete}
          disabled={isDeleting}
          className="shrink-0 text-status-danger-fg hover:text-status-danger-fg"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function NewSettingDialog({ defaultGroup }: { defaultGroup?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SiteSettingInput>({
    resolver: zodResolver(siteSettingSchema),
    defaultValues: { key: "", value: "", label: "", group: defaultGroup ?? "geral" },
  });

  async function onSubmit(data: SiteSettingInput) {
    const result = await createSiteSettingAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Configuração criada");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4" />
          Nova configuração
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova configuração</DialogTitle>
          <DialogDescription>
            Define um texto/título editável. A chave é usada para ler esse valor no código do site.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.label}>
              <FieldLabel htmlFor="new-label">Rótulo (nome amigável)</FieldLabel>
              <Input id="new-label" placeholder="Título da hero" {...register("label")} />
              <FieldError errors={[errors.label]} />
            </Field>
            <Field data-invalid={!!errors.key}>
              <FieldLabel htmlFor="new-key">Chave</FieldLabel>
              <Input id="new-key" placeholder="hero.titulo" {...register("key")} />
              <FieldError errors={[errors.key]} />
            </Field>
            <Field data-invalid={!!errors.group}>
              <FieldLabel htmlFor="new-group">Grupo</FieldLabel>
              <Input id="new-group" placeholder="home" {...register("group")} />
              <FieldError errors={[errors.group]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-value">Valor</FieldLabel>
              <Textarea id="new-value" rows={3} {...register("value")} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SiteSettingsEditor({
  settings,
  defaultGroup,
  emptyMessage,
}: {
  settings: Setting[];
  defaultGroup?: string;
  emptyMessage: string;
}) {
  const groups = new Map<string, Setting[]>();
  for (const setting of settings) {
    const list = groups.get(setting.group) ?? [];
    list.push(setting);
    groups.set(setting.group, list);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewSettingDialog defaultGroup={defaultGroup} />
      </div>

      {settings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</CardContent>
        </Card>
      ) : (
        Array.from(groups.entries()).map(([group, items]) => (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-sm font-medium capitalize">{group}</CardTitle>
            </CardHeader>
            <CardContent>
              {items.map((setting) => (
                <SettingRow key={setting.id} setting={setting} />
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
