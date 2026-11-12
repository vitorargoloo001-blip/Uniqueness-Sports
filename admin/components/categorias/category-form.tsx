"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { categorySchema, type CategoryInput } from "@/lib/validations";
import { slugify } from "@/lib/slug";
import { createCategoryAction, updateCategoryAction } from "@/lib/categories-actions";

type Category = { id: string; name: string; slug: string; imageUrl: string | null };

export function CategoryForm({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(!!category);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    values: category
      ? { name: category.name, slug: category.slug, imageUrl: category.imageUrl }
      : { name: "", slug: "", imageUrl: null },
  });

  const imageUrl = watch("imageUrl");

  function handleNameChange(value: string) {
    setValue("name", value);
    if (!slugTouched) setValue("slug", slugify(value));
  }

  async function onSubmit(data: CategoryInput) {
    const result = category
      ? await updateCategoryAction(category.id, data)
      : await createCategoryAction(data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(category ? "Categoria atualizada" : "Categoria criada");
    onOpenChange(false);
    reset();
    setSlugTouched(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{category ? "Editar categoria" : "Nova categoria"}</SheetTitle>
          <SheetDescription>
            Categorias organizam o catálogo e aparecem nos filtros do site.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input
                id="name"
                {...register("name")}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.slug}>
              <FieldLabel htmlFor="slug">Slug (URL)</FieldLabel>
              <Input
                id="slug"
                {...register("slug", {
                  onChange: () => setSlugTouched(true),
                })}
              />
              <FieldError errors={[errors.slug]} />
            </Field>

            <Field>
              <FieldLabel>Imagem</FieldLabel>
              <ImageUpload
                value={imageUrl}
                onChange={(url) => setValue("imageUrl", url)}
                folder="categories"
              />
            </Field>
          </FieldGroup>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {category ? "Salvar alterações" : "Criar categoria"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
