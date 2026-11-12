"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { ImageUpload } from "@/components/upload/image-upload";
import { bannerSchema, type BannerInput } from "@/lib/validations";
import { createBannerAction, updateBannerAction } from "@/lib/banners-actions";

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

type BannerFormValues = z.input<typeof bannerSchema>;

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function BannerForm({
  open,
  onOpenChange,
  banner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: Banner | null;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormValues, unknown, BannerInput>({
    resolver: zodResolver(bannerSchema),
    values: banner
      ? {
          title: banner.title,
          subtitle: banner.subtitle,
          imageUrl: banner.imageUrl,
          linkUrl: banner.linkUrl,
          position: banner.position,
          isActive: banner.isActive,
          startsAt: toDateInputValue(banner.startsAt),
          endsAt: toDateInputValue(banner.endsAt),
        }
      : {
          title: "",
          subtitle: "",
          imageUrl: "",
          linkUrl: "",
          position: 0,
          isActive: true,
          startsAt: "",
          endsAt: "",
        },
  });

  const imageUrl = watch("imageUrl");

  async function onSubmit(data: BannerInput) {
    const result = banner ? await updateBannerAction(banner.id, data) : await createBannerAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(banner ? "Banner atualizado" : "Banner criado");
    onOpenChange(false);
    reset();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{banner ? "Editar banner" : "Novo banner"}</SheetTitle>
          <SheetDescription>Banners aparecem na home e páginas de destaque da loja.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <FieldGroup>
            <Field data-invalid={!!errors.imageUrl}>
              <FieldLabel>Imagem</FieldLabel>
              <ImageUpload
                value={imageUrl}
                onChange={(url) => setValue("imageUrl", url ?? "")}
                folder="banners"
                aspectClassName="aspect-video"
              />
              <FieldError errors={[errors.imageUrl]} />
            </Field>

            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="title">Título</FieldLabel>
              <Input id="title" {...register("title")} />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="subtitle">Subtítulo (opcional)</FieldLabel>
              <Input id="subtitle" {...register("subtitle")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="linkUrl">Link (opcional)</FieldLabel>
              <Input id="linkUrl" placeholder="/produtos/categoria" {...register("linkUrl")} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="position">Ordem</FieldLabel>
                <Input id="position" type="number" min="0" {...register("position")} />
              </Field>
              <Field orientation="horizontal" className="items-end pb-1">
                <FieldLabel htmlFor="isActive">Ativo</FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="startsAt">Exibir a partir de</FieldLabel>
                <Input id="startsAt" type="date" {...register("startsAt")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="endsAt">Exibir até</FieldLabel>
                <Input id="endsAt" type="date" {...register("endsAt")} />
              </Field>
            </div>
          </FieldGroup>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {banner ? "Salvar alterações" : "Criar banner"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
