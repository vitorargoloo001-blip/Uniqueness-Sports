import type { Metadata } from "next";
import { listCategories } from "@/lib/categories";
import { CategoriesTable } from "@/components/categorias/categories-table";

export const metadata: Metadata = { title: "Categorias · Uniqueness Admin" };

export default async function CategoriasPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Categorias</h1>
        <p className="text-sm text-muted-foreground">Organize o catálogo por categoria.</p>
      </div>
      <CategoriesTable categories={categories} />
    </div>
  );
}
