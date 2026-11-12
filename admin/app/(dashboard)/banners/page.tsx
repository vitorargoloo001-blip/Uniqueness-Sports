import type { Metadata } from "next";
import { listBanners } from "@/lib/banners";
import { BannersTable } from "@/components/banners/banners-table";

export const metadata: Metadata = { title: "Banners · Uniqueness Admin" };

export default async function BannersPage() {
  const banners = await listBanners();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Banners</h1>
        <p className="text-sm text-muted-foreground">Imagens de destaque exibidas na loja.</p>
      </div>
      <BannersTable banners={banners} />
    </div>
  );
}
