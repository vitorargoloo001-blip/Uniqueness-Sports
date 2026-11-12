import type { Metadata } from "next";
import { listSiteSettings } from "@/lib/site-settings";
import { SiteSettingsEditor } from "@/components/site-settings/site-settings-editor";

export const metadata: Metadata = { title: "Conteúdo do site · Uniqueness Admin" };

export default async function ConteudoPage() {
  const all = await listSiteSettings();
  const settings = all.filter((s) => s.group !== "geral");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Conteúdo do site</h1>
        <p className="text-sm text-muted-foreground">
          Títulos e textos das seções da home e páginas da loja. Cada valor é lido pelo código do site pela
          respectiva chave — criar uma configuração aqui só afeta a loja depois que a página correspondente for
          conectada a essa chave.
        </p>
      </div>
      <SiteSettingsEditor
        settings={settings}
        defaultGroup="home"
        emptyMessage="Nenhum texto configurado ainda. Use “Nova configuração” para criar o primeiro."
      />
    </div>
  );
}
