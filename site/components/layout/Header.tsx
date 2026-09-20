import { auth } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import HeaderClient from "@/components/layout/HeaderClient";

export default async function Header() {
  const [session, cart] = await Promise.all([auth(), getCart()]);

  return (
    <HeaderClient
      session={session}
      itemCount={cart.itemCount}
      items={cart.items}
      subtotal={cart.subtotal}
    />
  );
}
