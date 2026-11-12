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
import { couponSchema, type CouponInput } from "@/lib/validations";
import { createCouponAction, updateCouponAction } from "@/lib/coupons-actions";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number | string;
  minOrderValue: number | string | null;
  maxUses: number | null;
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  productId: string | null;
  categoryId: string | null;
};

type CouponFormValues = z.input<typeof couponSchema>;

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function CouponForm({
  open,
  onOpenChange,
  coupon,
  products,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon?: Coupon | null;
  products: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues, unknown, CouponInput>({
    resolver: zodResolver(couponSchema),
    values: coupon
      ? {
          code: coupon.code,
          type: coupon.type,
          value: Number(coupon.value),
          minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
          maxUses: coupon.maxUses,
          isActive: coupon.isActive,
          startsAt: toDateInputValue(coupon.startsAt),
          expiresAt: toDateInputValue(coupon.expiresAt),
          scope: coupon.productId ? "PRODUCT" : coupon.categoryId ? "CATEGORY" : "STORE",
          productId: coupon.productId,
          categoryId: coupon.categoryId,
        }
      : {
          code: "",
          type: "PERCENT",
          value: 0,
          minOrderValue: null,
          maxUses: null,
          isActive: true,
          startsAt: "",
          expiresAt: "",
          scope: "STORE",
          productId: null,
          categoryId: null,
        },
  });

  const scope = watch("scope");

  async function onSubmit(data: CouponInput) {
    const result = coupon ? await updateCouponAction(coupon.id, data) : await createCouponAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(coupon ? "Cupom atualizado" : "Cupom criado");
    onOpenChange(false);
    reset();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{coupon ? "Editar cupom" : "Novo cupom"}</SheetTitle>
          <SheetDescription>Cupons aplicam desconto no checkout da loja.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <FieldGroup>
            <Field data-invalid={!!errors.code}>
              <FieldLabel htmlFor="code">Código</FieldLabel>
              <Input id="code" placeholder="EX: BEMVINDO10" className="uppercase" {...register("code")} />
              <FieldError errors={[errors.code]} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="type">Tipo</FieldLabel>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">Percentual (%)</SelectItem>
                        <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field data-invalid={!!errors.value}>
                <FieldLabel htmlFor="value">Valor</FieldLabel>
                <Input id="value" type="number" step="0.01" min="0" {...register("value")} />
                <FieldError errors={[errors.value]} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="minOrderValue">Pedido mínimo (opcional)</FieldLabel>
                <Input id="minOrderValue" type="number" step="0.01" min="0" {...register("minOrderValue")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="maxUses">Usos máximos (opcional)</FieldLabel>
                <Input id="maxUses" type="number" min="1" {...register("maxUses")} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="scope">Aplicação</FieldLabel>
              <Controller
                control={control}
                name="scope"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="scope" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STORE">Loja inteira</SelectItem>
                      <SelectItem value="PRODUCT">Produto específico</SelectItem>
                      <SelectItem value="CATEGORY">Categoria específica</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Restringe o desconto a um produto ou categoria — deixe em &quot;Loja inteira&quot; pra valer no
                carrinho todo.
              </FieldDescription>
            </Field>

            {scope === "PRODUCT" && (
              <Field data-invalid={!!errors.productId}>
                <FieldLabel htmlFor="productId">Produto</FieldLabel>
                <Controller
                  control={control}
                  name="productId"
                  render={({ field }) => (
                    <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                      <SelectTrigger id="productId" className="w-full">
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.productId]} />
              </Field>
            )}

            {scope === "CATEGORY" && (
              <Field data-invalid={!!errors.categoryId}>
                <FieldLabel htmlFor="categoryId">Categoria</FieldLabel>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                      <SelectTrigger id="categoryId" className="w-full">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.categoryId]} />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="startsAt">Válido a partir de</FieldLabel>
                <Input id="startsAt" type="date" {...register("startsAt")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="expiresAt">Válido até</FieldLabel>
                <Input id="expiresAt" type="date" {...register("expiresAt")} />
              </Field>
            </div>

            <Field orientation="horizontal">
              <FieldLabel htmlFor="isActive">Cupom ativo</FieldLabel>
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
              {coupon ? "Salvar alterações" : "Criar cupom"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
