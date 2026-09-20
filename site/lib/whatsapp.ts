const FALLBACK_NUMBER = "5500000000000";

function getNumber() {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? FALLBACK_NUMBER).replace(
    /\D/g,
    "",
  );
}

export function whatsappLink(message: string) {
  return `https://wa.me/${getNumber()}?text=${encodeURIComponent(message)}`;
}

export function productWhatsappLink(productName: string) {
  return whatsappLink(
    `Olá! Quero saber mais sobre o ${productName} da Uniqueness Sports.`,
  );
}

export const generalWhatsappLink = () =>
  whatsappLink("Olá! Quero conhecer os produtos da Uniqueness Sports.");
