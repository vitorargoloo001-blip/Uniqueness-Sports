import type { Metadata } from "next";
import { listCustomers } from "@/lib/customers";
import { CustomersTable } from "@/components/clientes/customers-table";

export const metadata: Metadata = { title: "Clientes · Uniqueness Admin" };

export default async function ClientesPage() {
  const customers = await listCustomers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground">Base de clientes cadastrados na loja.</p>
      </div>
      <CustomersTable customers={customers} />
    </div>
  );
}
