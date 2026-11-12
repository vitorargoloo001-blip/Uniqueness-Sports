"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldError, FieldGroup, FieldDescription } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/upload/image-upload";
import { productSchema, type ProductInput } from "@/lib/validations";

type ProductFormValues = z.input<typeof productSchema>;
import { slugify } from "@/lib/slug";
import { createProductAction, updateProductAction } from "@/lib/products-actions";

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
  weightGrams: number | null;
  unitsPerBox: number | null;
  heightCm: number | null;
  widthCm: number | null;
  lengthCm: number | null;
};

// Só o peso importa: todo pedido sai na mesma caixa (ver SHIPPING_BOX em
// site/lib/shipping-rules.ts), e o peso dela já é somado automaticamente.
const MEASURE_FIELDS = [
  { name: "weightGrams", label: "Peso do produto (g)" },
  { name: "unitsPerBox", label: "Cabem por caixa" },
] as const;

export function ProductForm({
  open,
  onOpenChange,
  product,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(!!product);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    values: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          sku: product.sku,
          stock: product.stock,
          imageUrl: product.imageUrl,
          isActive: product.isActive,
          categoryId: product.categoryId,
          weightGrams: product.weightGrams,
          unitsPerBox: product.unitsPerBox,
          heightCm: product.heightCm,
          widthCm: product.widthCm,
          lengthCm: product.lengthCm,
        }
      : {
          name: "",
          slug: "",
          description: "",
          shortDescription: "",
          price: 0,
          compareAtPrice: null,
          sku: "",
          stock: 0,
          imageUrl: null,
          isActive: true,
          categoryId: null,
          weightGrams: null,
          unitsPerBox: null,
          heightCm: null,
          widthCm: null,
          lengthCm: null,
        },
  });

  const imageUrl = watch("imageUrl");

  function handleNameChange(value: string) {
    setValue("name", value);
    if (!slugTouched) setValue("slug", slugify(value));
  }

  async function onSubmit(data: ProductInput) {
    const result = product ? await updateProductAction(product.id, data) : await createProductAction(data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(product ? "Produto atualizado" : "Produto criado");
    onOpenChange(false);
    reset();
    setSlugTouched(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{product ? "Editar produto" : "Novo produto"}</SheetTitle>
          <SheetDescription>Preços, estoque e conteúdo exibidos na loja.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Imagem</FieldLabel>
              <ImageUpload value={imageUrl} onChange={(url) => setValue("imageUrl", url)} folder="products" />
            </Field>

            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input id="name" {...register("name")} onChange={(e) => handleNameChange(e.target.value)} />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.slug}>
              <FieldLabel htmlFor="slug">Slug (URL)</FieldLabel>
              <Input id="slug" {...register("slug", { onChange: () => setSlugTouched(true) })} />
              <FieldError errors={[errors.slug]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="categoryId">Categoria</FieldLabel>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? null : v)}>
                    <SelectTrigger id="categoryId" className="w-full">
                      <SelectValue placeholder="Sem categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.price}>
                <FieldLabel htmlFor="price">Preço (R$)</FieldLabel>
                <Input id="price" type="number" step="0.01" min="0" {...register("price")} />
                <FieldError errors={[errors.price]} />
              </Field>
              <Field data-invalid={!!errors.compareAtPrice}>
                <FieldLabel htmlFor="compareAtPrice">Preço &quot;de&quot; (opcional)</FieldLabel>
                <Input id="compareAtPrice" type="number" step="0.01" min="0" {...register("compareAtPrice")} />
                <FieldError errors={[errors.compareAtPrice]} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.stock}>
                <FieldLabel htmlFor="stock">Estoque</FieldLabel>
                <Input id="stock" type="number" min="0" {...register("stock")} />
                <FieldError errors={[errors.stock]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="sku">SKU (opcional)</FieldLabel>
                <Input id="sku" {...register("sku")} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Peso para frete</FieldLabel>
              <FieldDescription>
                Peso de uma unidade (sem a caixa) e quantas unidades cabem numa caixa de
                18,5 × 9,5 × 12 cm. Pedido maior que uma caixa é cotado em várias, e os 80 g
                de cada caixa entram no cálculo. Em branco: 500 g e 4 por caixa.
              </FieldDescription>
              <div className="grid grid-cols-2 gap-3">
                {MEASURE_FIELDS.map((measure) => (
                  <Field key={measure.name} data-invalid={!!errors[measure.name]}>
                    <FieldLabel htmlFor={measure.name}>{measure.label}</FieldLabel>
                    <Input id={measure.name} type="number" min="1" step="1" {...register(measure.name)} />
                    <FieldError errors={[errors[measure.name]]} />
                  </Field>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="shortDescription">Descrição curta</FieldLabel>
              <Input id="shortDescription" {...register("shortDescription")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descrição completa</FieldLabel>
              <Textarea id="description" rows={5} {...register("description")} />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor="isActive">Produto ativo (visível na loja)</FieldLabel>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </Field>
          </FieldGroup>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {product ? "Salvar alterações" : "Criar produto"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
