import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  slug: z
    .string()
    .min(2, "Slug muito curto")
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífen"),
  imageUrl: z.string().optional().nullable(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

// Medida opcional do produto: campo vazio vira null (o site usa a caixa
// padrão de site/lib/shipping-rules.ts na cotação de frete).
const optionalMeasure = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
  z.number().int("Use um número inteiro").positive("Deve ser maior que zero").nullable(),
);

export const productSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  slug: z
    .string()
    .min(2, "Slug muito curto")
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífen"),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  sku: z.string().optional().nullable(),
  stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean(),
  categoryId: z.string().optional().nullable(),
  weightGrams: optionalMeasure,
  unitsPerBox: optionalMeasure,
  heightCm: optionalMeasure,
  widthCm: optionalMeasure,
  lengthCm: optionalMeasure,
});
export type ProductInput = z.infer<typeof productSchema>;

export const couponScopeSchema = z.enum(["STORE", "PRODUCT", "CATEGORY"]);
export type CouponScope = z.infer<typeof couponScopeSchema>;

export const couponSchema = z
  .object({
    code: z
      .string()
      .min(3, "Código muito curto")
      .transform((v) => v.toUpperCase().trim()),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().positive("Valor deve ser maior que zero"),
    minOrderValue: z.coerce.number().positive().optional().nullable(),
    maxUses: z.coerce.number().int().positive().optional().nullable(),
    isActive: z.boolean(),
    startsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    // Escopo do desconto: loja inteira, ou só um produto/categoria
    // específico. productId/categoryId só valem quando o scope
    // correspondente está selecionado — ver toData() em coupons-actions.ts.
    scope: couponScopeSchema.default("STORE"),
    productId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
  })
  .refine((data) => data.type !== "PERCENT" || data.value <= 100, {
    message: "Desconto percentual não pode passar de 100%",
    path: ["value"],
  })
  .refine((data) => data.scope !== "PRODUCT" || !!data.productId, {
    message: "Selecione o produto",
    path: ["productId"],
  })
  .refine((data) => data.scope !== "CATEGORY" || !!data.categoryId, {
    message: "Selecione a categoria",
    path: ["categoryId"],
  });
export type CouponInput = z.infer<typeof couponSchema>;

export const bannerSchema = z.object({
  title: z.string().min(2, "Título muito curto"),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().min(1, "Imagem é obrigatória"),
  linkUrl: z.string().optional().nullable(),
  position: z.coerce.number().int().min(0),
  isActive: z.boolean(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});
export type BannerInput = z.infer<typeof bannerSchema>;

export const siteSettingSchema = z.object({
  key: z
    .string()
    .min(2, "Chave muito curta")
    .regex(/^[a-z0-9_.]+$/, "Chave deve conter apenas letras minúsculas, números, _ e ."),
  value: z.string(),
  label: z.string().min(2, "Rótulo muito curto"),
  group: z.string().min(1, "Grupo é obrigatório"),
});
export type SiteSettingInput = z.infer<typeof siteSettingSchema>;

export const adminUserSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});
export type AdminUserInput = z.infer<typeof adminUserSchema>;
