import { z } from "zod";

export function isValidCpf(rawCpf: string): boolean {
  const digits = rawCpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const checkDigit = (base: string) => {
    let sum = 0;
    let factor = base.length + 1;
    for (const digit of base) sum += Number(digit) * factor--;
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base = digits.slice(0, 9);
  const d1 = checkDigit(base);
  const d2 = checkDigit(base + d1);
  return digits === base + String(d1) + String(d2);
}

const cpfSchema = z
  .string()
  .min(1, "CPF é obrigatório")
  .refine(isValidCpf, "CPF inválido");

const zipCodeSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, "CEP inválido (formato 00000-000)");

const ufSchema = z
  .string()
  .length(2, "UF inválida")
  .toUpperCase();

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  phone: z.string().min(8, "Telefone inválido").optional().or(z.literal("")),
  cpf: cpfSchema.optional().or(z.literal("")),
});

export const addressInputSchema = z.object({
  label: z.string().optional().or(z.literal("")),
  recipient: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  zipCode: zipCodeSchema,
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional().or(z.literal("")),
  district: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: ufSchema,
  isDefault: z.boolean().optional(),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerEmail: z.email("Email inválido"),
  customerPhone: z.string().min(8, "Telefone é obrigatório"),
  customerCpf: cpfSchema,
  zipCode: zipCodeSchema,
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional().or(z.literal("")),
  district: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: ufSchema,
  saveAddress: z.boolean().optional(),
  // 0 = nada escolhido ainda (o form só preenche depois de cotar o CEP).
  shippingServiceId: z.number().int().positive("Escolha uma opção de frete"),
});

export const trackOrderSchema = z.object({
  orderNumber: z.string().min(1, "Número do pedido é obrigatório"),
  email: z.email("Email inválido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type AddressInput = z.infer<typeof addressInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type TrackOrderInput = z.infer<typeof trackOrderSchema>;
