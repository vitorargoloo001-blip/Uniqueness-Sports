"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import { createOrderAction, type CreatedOrder } from "@/lib/checkout";
import { getShippingOptionsAction } from "@/lib/shipping";
import { formatPrice } from "@/lib/format";
import type { ShippingOption } from "@/lib/shipping-rules";
import { useCheckoutShipping } from "@/components/store/CheckoutShipping";
import CheckoutPayment from "@/components/store/CheckoutPayment";

const IDENTIFICATION_FIELDS: { name: keyof CheckoutInput; label: string; span?: string }[] = [
  { name: "customerName", label: "Nome completo", span: "sm:col-span-2" },
  { name: "customerEmail", label: "Email" },
  { name: "customerPhone", label: "Telefone" },
  { name: "customerCpf", label: "CPF" },
];

const DELIVERY_FIELDS: { name: keyof CheckoutInput; label: string; span?: string }[] = [
  { name: "zipCode", label: "CEP" },
  { name: "street", label: "Rua", span: "sm:col-span-2" },
  { name: "number", label: "Número" },
  { name: "complement", label: "Complemento" },
  { name: "district", label: "Bairro" },
  { name: "city", label: "Cidade" },
  { name: "state", label: "UF" },
];

export default function CheckoutForm({
  defaultValues,
  isLoggedIn,
  cartTotal,
}: {
  defaultValues: CheckoutInput;
  isLoggedIn: boolean;
  /** Muda quando um cupom entra/sai — o frete é recotado (regra de frete grátis). */
  cartTotal: number;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  // Setado quando o pedido é criado — a partir daí a etapa de pagamento
  // (Payment Brick embutido, sem redirecionar) substitui esse formulário.
  const [order, setOrder] = useState<CreatedOrder | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues,
  });

  const { selected, setSelected } = useCheckoutShipping();
  const [quote, setQuote] = useState<{
    zip: string;
    options: ShippingOption[];
    error: string | null;
  } | null>(null);
  const [isQuoting, startQuoting] = useTransition();

  const currentZip = () => getValues("zipCode").replace(/\D/g, "");

  function selectShipping(option: ShippingOption | null) {
    setSelected(option);
    setValue("shippingServiceId", option?.serviceId ?? 0, { shouldValidate: isSubmitted });
  }

  function loadQuote(zip: string) {
    startQuoting(async () => {
      const result = await getShippingOptionsAction(zip);
      // Descarta resposta atrasada: o CEP mudou enquanto cotava.
      if (currentZip() !== zip) return;
      const options = result.success ? result.data : [];
      setQuote({ zip, options, error: result.success ? null : result.error });
      // Mantém a escolha se continua disponível (com o preço novo); senão, a mais barata.
      const current = getValues("shippingServiceId");
      selectShipping(options.find((o) => o.serviceId === current) ?? options[0] ?? null);
    });
  }

  function handleZipChange() {
    const zip = currentZip();
    if (zip.length === 8) {
      if (zip !== quote?.zip) loadQuote(zip);
    } else if (quote) {
      setQuote(null);
      selectShipping(null);
    }
  }

  // Cota o CEP que já veio preenchido (endereço salvo) e recota quando o
  // total do carrinho muda.
  const quoteFilledZip = useEffectEvent(() => {
    const zip = currentZip();
    if (zip.length === 8) loadQuote(zip);
  });
  useEffect(() => {
    quoteFilledZip();
  }, [cartTotal]);

  async function onSubmit(data: CheckoutInput) {
    setServerError(null);
    const result = await createOrderAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setOrder(result.data);
  }

  // Pedido criado: troca o formulário pelo pagamento embutido (cartão, Pix
  // ou boleto, direto na página — sem redirecionar pro Mercado Pago).
  if (order) {
    return <CheckoutPayment order={order} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">
          Identificação
        </h2>
        <p className="mt-1 text-xs text-gray">
          Use seus dados salvos ou preencha as informações para concluir a compra.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {IDENTIFICATION_FIELDS.map((field) => (
            <div key={field.name} className={field.span}>
              <label className="text-xs uppercase tracking-[0.08em] text-gray">
                {field.label}
              </label>
              <input
                type="text"
                {...register(field.name)}
                className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
              />
              {errors[field.name] && (
                <p className="mt-1 text-xs text-red-600">{errors[field.name]?.message}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">
          Entrega
        </h2>
        <p className="mt-1 text-xs text-gray">
          Escolha um endereço salvo ou cadastre um novo endereço de entrega.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {DELIVERY_FIELDS.map((field) => (
            <div key={field.name} className={field.span}>
              <label className="text-xs uppercase tracking-[0.08em] text-gray">
                {field.label}
              </label>
              <input
                type="text"
                {...register(
                  field.name,
                  field.name === "zipCode"
                    ? { onChange: handleZipChange }
                    : undefined,
                )}
                className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
              />
              {errors[field.name] && (
                <p className="mt-1 text-xs text-red-600">{errors[field.name]?.message}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.08em] text-gray">Frete</p>
          {isQuoting ? (
            <p className="mt-2 text-sm text-gray">Calculando frete…</p>
          ) : !quote ? (
            <p className="mt-2 text-sm text-gray">Informe o CEP para ver as opções de entrega.</p>
          ) : quote.error ? (
            <p className="mt-2 text-sm text-red-600">{quote.error}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {quote.options.map((option) => {
                const isSelected = selected?.serviceId === option.serviceId;
                return (
                  <li key={option.serviceId}>
                    <label
                      className={`flex cursor-pointer items-center justify-between gap-4 border bg-surface px-4 py-3 text-sm ${isSelected ? "border-ink" : "border-border"}`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingOption"
                          checked={isSelected}
                          onChange={() => selectShipping(option)}
                          className="h-4 w-4 accent-ink"
                        />
                        <span>
                          <span className="block text-ink">{option.label}</span>
                          <span className="block text-xs text-gray">
                            Até {option.deliveryDays} {option.deliveryDays === 1 ? "dia útil" : "dias úteis"}
                          </span>
                        </span>
                      </span>
                      <span className="text-right text-ink">
                        {option.free ? (
                          <>
                            <span className="mr-2 text-xs text-gray line-through">
                              {formatPrice(option.quotedPrice)}
                            </span>
                            Grátis
                          </>
                        ) : (
                          formatPrice(option.price)
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {errors.shippingServiceId && (
            <p className="mt-1 text-xs text-red-600">{errors.shippingServiceId.message}</p>
          )}
        </div>
      </div>

      {isLoggedIn && (
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" {...register("saveAddress")} className="h-4 w-4" />
          Salvar esse endereço na minha conta
        </label>
      )}

      {serverError && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {serverError}
        </p>
      )}

      <div>
        <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">
          Pagamento
        </h2>
        <p className="mt-1 text-xs text-gray">
          Cartão, Pix ou boleto — direto aqui no site, sem redirecionamento.
        </p>
        <button
          type="submit"
          disabled={isSubmitting || isQuoting}
          className="mt-4 w-full bg-ink px-6 py-4 font-heading text-sm uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {isSubmitting ? "Processando..." : "Ir para pagamento →"}
        </button>
      </div>
    </form>
  );
}
