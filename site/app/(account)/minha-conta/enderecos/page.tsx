import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getUserAddresses } from "@/lib/account";
import AddressList from "@/components/account/AddressList";

export const metadata: Metadata = { title: "Endereços" };

export default async function EnderecosPage() {
  const session = await auth();
  const addresses = await getUserAddresses(session!.user.id);

  return (
    <div>
      <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">Endereços</h2>
      <p className="mt-1 text-sm text-gray">Salve seus endereços para comprar com mais rapidez.</p>
      <div className="mt-4">
        <AddressList addresses={addresses} />
      </div>
    </div>
  );
}
