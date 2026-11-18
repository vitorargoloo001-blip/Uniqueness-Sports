"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Payment, initMercadoPago } from "@mercadopago/sdk-react";
import type { IPaymentFormData } from "@mercadopago/sdk-react/esm/bricks/payment/type";
import { payOrderAction, getOrderStatusAction, type CreatedOrder } from "@/lib/checkout";
import { formatPrice } from "@/lib/format";
import { trackEvent } from "@/lib/meta-pixel";

// Chave pública, embutida no bundle do cliente pelo Next.js (NEXT_PUBLIC_*)
// — não é segredo, é o par da MERCADO_PAGO_ACCESS_TOKEN (que fica só no servidor).
const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

// initMercadoPago só precisa rodar uma vez por carregamento de página,
// mesmo que o componente monte de novo (troca de aba, etc).
let mpInitialized = false;

const DECLINE_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount: "Cartão sem limite suficiente.",
  cc_rejected_bad_filled_security_code: "Código de segurança (CVV) inválido.",
  cc_rejected_bad_filled_date: "Data de validade inválida.",
  cc_rejected_bad_filled_other: "Revise os dados do cartão.",
  cc_rejected_bad_filled_card_number: "Número do cartão inválido.",
  cc_rejected_call_for_authorize: "O banco pediu autorização — ligue pra central do seu cartão ou tente outro.",
  cc_rejected_card_disabled: "Cartão desabilitado. Entre em contato com o banco ou tente outro cartão.",
  cc_rejected_duplicated_payment: "Esse pagamento já foi feito.",
  cc_rejected_high_risk: "Pagamento recusado por segurança. Tente outro cartão ou meio de pagamento.",
  cc_rejected_max_attempts: "Muitas tentativas com esse cartão. Tente outro.",
  cc_rejected_other_reason: "Cartão recusado pelo banco. Tente outro cartão.",
};

function declineMessage(statusDetail: string | null): string {
  return (statusDetail && DECLINE_MESSAGES[statusDetail]) || "Pagamento recusado. Tente outro cartão ou meio de pagamento.";
}

type PendingPayment = {
  pix: { qrCode: string; qrCodeBase64: string } | null;
  ticketUrl: string | null;
};

export default function CheckoutPayment({ order }: { order: CreatedOrder }) {
  const router = useRouter();
  // Bump força o Payment Brick a remontar do zero depois de uma recusa —
  // mais simples e seguro do que tentar reaproveitar o estado interno dele.
  const [brickKey, setBrickKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingPayment | null>(null);

  useEffect(() => {
    if (!PUBLIC_KEY || mpInitialized) return;
    initMercadoPago(PUBLIC_KEY, { locale: "pt-BR" });
    mpInitialized = true;
  }, []);

  // Pix/boleto: fica aguardando a confirmação e redireciona sozinho assim
  // que o pedido sair de "aguardando pagamento" — pelo webhook do Mercado
  // Pago, sem precisar de nenhuma ação do cliente.
  useEffect(() => {
    if (!pending) return;
    const interval = setInterval(async () => {
      const current = await getOrderStatusAction(order.orderId);
      if (current && current.status !== "PENDING_PAYMENT") {
        router.push(`/checkout/sucesso?order=${order.orderNumber}`);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [pending, order.orderId, order.orderNumber, router]);

  async function handleSubmit({ formData }: IPaymentFormData) {
    setErrorMessage(null);
    trackEvent("AddPaymentInfo", { value: order.total, currency: "BRL" });
    // formData vem tipado pelo SDK do Brick (sem índice genérico) — a
    // server action só precisa que seja um objeto plano serializável.
    const result = await payOrderAction(order.orderId, formData as unknown as Record<string, unknown>);

    if (!result.success) {
      setErrorMessage(result.error);
      setBrickKey((k) => k + 1);
      return;
    }
    if (result.data.status === "PAID") {
      router.push(`/checkout/sucesso?order=${order.orderNumber}`);
      return;
    }
    if (result.data.status === "PENDING") {
      setPending({ pix: result.data.pix, ticketUrl: result.data.ticketUrl });
      return;
    }
    // Nesse ponto (recém-criado, nunca foi PENDING_PAYMENT->PAID antes) só
    // sobra recusa de cartão — Pix/boleto não têm como "falhar" na hora.
    setErrorMessage(declineMessage(result.data.statusDetail));
    setBrickKey((k) => k + 1);
  }

  if (!PUBLIC_KEY) {
    return (
      <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        Pagamento não configurado: defina NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY nas variáveis de
        ambiente.
      </p>
    );
  }

  if (pending) {
    return (
      <PendingPanel pix={pending.pix} ticketUrl={pending.ticketUrl} orderNumber={order.orderNumber} />
    );
  }

  return (
    <div>
      <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">Pagamento</h2>
      <p className="mt-1 text-xs text-gray">
        Pedido {order.orderNumber} — {formatPrice(order.total)}. Pagamento seguro, direto aqui no
        site.
      </p>

      {errorMessage && (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="mt-4">
        <Payment
          key={brickKey}
          initialization={{
            amount: order.total,
            payer: {
              email: order.payer.email,
              firstName: order.payer.firstName,
              lastName: order.payer.lastName,
              identification: { type: "CPF", number: order.payer.cpf.replace(/\D/g, "") },
              address: {
                zipCode: order.payer.address.zipCode.replace(/\D/g, ""),
                streetName: order.payer.address.street,
                streetNumber: order.payer.address.number,
                complement: order.payer.address.complement,
                neighborhood: order.payer.address.district,
                city: order.payer.address.city,
                federalUnit: order.payer.address.state,
              },
            },
          }}
          customization={{
            paymentMethods: {
              creditCard: "all",
              ticket: "all",
              bankTransfer: "all",
              maxInstallments: 3,
            },
            // Troca o azul padrão da MP pelo preto da marca (--color-ink em
            // app/globals.css) — cantos retos pra combinar com o resto do checkout.
            visual: {
              style: {
                theme: "default",
                customVariables: {
                  baseColor: "#0A0A0A",
                  buttonTextColor: "#FFFFFF",
                  borderRadiusSmall: "0px",
                  borderRadiusMedium: "0px",
                  borderRadiusLarge: "0px",
                  borderRadiusFull: "0px",
                },
              },
            },
          }}
          onSubmit={handleSubmit}
          onError={(error) => {
            console.error("[checkout] erro no formulário de pagamento:", error);
            setErrorMessage("Não foi possível carregar o formulário de pagamento. Recarregue a página.");
          }}
        />
      </div>
    </div>
  );
}

function PendingPanel({
  pix,
  ticketUrl,
  orderNumber,
}: {
  pix: { qrCode: string; qrCodeBase64: string } | null;
  ticketUrl: string | null;
  orderNumber: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyPixCode() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard pode falhar (permissão, contexto não seguro) — o código
      // continua selecionável no campo abaixo, então não é bloqueante.
    }
  }

  return (
    <div className="border border-border bg-surface p-6 text-center">
      <p className="eyebrow text-xs text-gray">Pedido {orderNumber}</p>
      <h2 className="mt-2 font-heading text-lg uppercase text-ink">
        {pix ? "Pague com Pix" : "Pague o boleto"}
      </h2>

      {pix ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URI dinâmica por pagamento, next/image não otimiza nada aqui */}
          <img
            src={`data:image/png;base64,${pix.qrCodeBase64}`}
            alt="QR Code Pix"
            className="mx-auto mt-4 h-56 w-56"
          />
          <p className="mt-4 text-sm text-gray">Ou copie o código:</p>
          <textarea
            readOnly
            value={pix.qrCode}
            rows={3}
            onFocus={(e) => e.target.select()}
            className="mt-2 w-full resize-none border border-border bg-white p-2 text-xs text-ink"
          />
          <button
            type="button"
            onClick={copyPixCode}
            className="mt-2 border border-ink px-4 py-2 font-heading text-xs uppercase tracking-[0.1em] text-ink hover:bg-[#F7F5F0]"
          >
            {copied ? "Copiado!" : "Copiar código"}
          </button>
        </>
      ) : (
        <a
          href={ticketUrl ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block bg-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white hover:opacity-85"
        >
          Ver boleto
        </a>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-gray">
        <span className="h-2 w-2 animate-pulse rounded-full bg-ink" />
        Aguardando confirmação do pagamento — assim que cair, você é redirecionado automaticamente.
      </p>
    </div>
  );
}
