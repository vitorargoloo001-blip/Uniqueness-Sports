import type { Metadata } from "next";
import { listLeads } from "@/lib/leads";
import { LeadsTable } from "@/components/demandas/leads-table";

export const metadata: Metadata = { title: "Demandas · Uniqueness Admin" };

export default async function DemandasPage() {
  const leads = await listLeads();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Demandas</h1>
        <p className="text-sm text-muted-foreground">
          Contatos e interesses recebidos pela loja.
          {leads.length === 0 && (
            <>
              {" "}
              Nenhuma ainda — o site ainda não tem um formulário público conectado a essa tabela; a página
              /contato hoje só oferece links de WhatsApp/email.
            </>
          )}
        </p>
      </div>
      <LeadsTable leads={leads} />
    </div>
  );
}
