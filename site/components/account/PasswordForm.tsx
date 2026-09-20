"use client";

import { useState } from "react";
import { changePasswordAction } from "@/lib/account";

export default function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (next !== confirm) {
      setMessage({ type: "error", text: "As senhas não coincidem" });
      return;
    }

    setIsSubmitting(true);
    const result = await changePasswordAction(current, next);
    setIsSubmitting(false);

    if (!result.success) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setMessage({ type: "ok", text: "Senha alterada com sucesso." });
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 border border-border bg-surface p-6">
      <div>
        <label className="text-xs uppercase tracking-[0.08em] text-gray">Senha atual</label>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.08em] text-gray">Nova senha</label>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={6}
          className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.08em] text-gray">Confirmar nova senha</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          className="mt-1 w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-ink/70" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-ink px-6 py-3 font-heading text-xs uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        {isSubmitting ? "Salvando..." : "Alterar senha"}
      </button>
    </form>
  );
}
