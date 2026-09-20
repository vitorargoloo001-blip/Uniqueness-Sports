import type { Metadata } from "next";
import PasswordForm from "@/components/account/PasswordForm";

export const metadata: Metadata = { title: "Segurança" };

export default function SegurancaPage() {
  return (
    <div>
      <h2 className="font-heading text-sm uppercase tracking-[0.1em] text-ink">Segurança</h2>
      <div className="mt-4">
        <PasswordForm />
      </div>
    </div>
  );
}
