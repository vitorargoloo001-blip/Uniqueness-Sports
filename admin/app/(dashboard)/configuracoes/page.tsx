import type { Metadata } from "next";
import { listSiteSettings } from "@/lib/site-settings";
import { listAdminUsers } from "@/lib/admin-users";
import { SiteSettingsEditor } from "@/components/site-settings/site-settings-editor";
import { AdminTeam } from "@/components/configuracoes/admin-team";

export const metadata: Metadata = { title: "Configurações · Uniqueness Admin" };

export default async function ConfiguracoesPage() {
  const [all, admins] = await Promise.all([listSiteSettings(), listAdminUsers()]);
  const settings = all.filter((s) => s.group === "geral");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Equipe com acesso ao painel e dados gerais da loja.</p>
      </div>

      <AdminTeam admins={admins} />

      <div>
        <h2 className="mb-2 text-sm font-medium text-foreground">Dados gerais</h2>
        <SiteSettingsEditor
          settings={settings}
          defaultGroup="geral"
          emptyMessage="Nenhuma configuração geral cadastrada ainda (ex: telefone, endereço, redes sociais)."
        />
      </div>
    </div>
  );
}
