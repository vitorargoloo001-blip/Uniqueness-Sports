import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Dados pessoais" };

export default async function DadosPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });

  return (
    <div>
      <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">Dados pessoais</h2>
      <p className="mt-1 text-sm text-gray">
        Mantenha suas informações atualizadas para agilizar suas próximas compras.
      </p>
      <div className="mt-4">
        <ProfileForm
          email={user?.email ?? ""}
          defaultValues={{
            name: user?.name ?? "",
            phone: user?.phone ?? "",
            cpf: user?.cpf ?? "",
          }}
        />
      </div>
    </div>
  );
}
