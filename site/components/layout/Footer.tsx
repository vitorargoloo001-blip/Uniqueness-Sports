"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { generalWhatsappLink } from "@/lib/whatsapp";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    setEmail("");
  }

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Image
              src="/identidade/logo.png"
              alt="Uniqueness Sports"
              width={160}
              height={48}
              className="h-9 w-auto"
            />
            <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-white/60">
              Suplementos, roupas e acessórios pra quem treina com constância.
            </p>
            <div className="mt-5 flex gap-4 text-xs uppercase tracking-[0.12em] text-white/70">
              <a href="https://www.instagram.com/uniqueness_sports" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Instagram
              </a>
            </div>
            <div className="mt-2 flex flex-col gap-2 text-xs uppercase tracking-[0.12em] text-white/70">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                YouTube
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                TikTok
              </a>
              <a href={generalWhatsappLink()} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-xs uppercase tracking-[0.2em] text-white/50">
              Institucional
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li><Link href="/sobre" className="hover:text-white">Sobre nós</Link></li>
              <li><Link href="/sobre" className="hover:text-white">Nossa história</Link></li>
              <li><Link href="/sobre" className="hover:text-white">Valores</Link></li>
              <li><Link href="/contato" className="hover:text-white">Trabalhe conosco</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-xs uppercase tracking-[0.2em] text-white/50">
              Ajuda
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li><Link href="/contato" className="hover:text-white">Central de ajuda</Link></li>
              <li><Link href="/rastrear-pedido" className="hover:text-white">Rastrear pedido</Link></li>
              <li><Link href="/contato" className="hover:text-white">Trocas e devoluções</Link></li>
              <li><Link href="/contato" className="hover:text-white">Política de privacidade</Link></li>
              <li><Link href="/contato" className="hover:text-white">Termos de uso</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-xs uppercase tracking-[0.2em] text-white/50">
              Informações
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li><Link href="/contato" className="hover:text-white">Frete e prazos</Link></li>
              <li><Link href="/contato" className="hover:text-white">Formas de pagamento</Link></li>
              <li><Link href="/contato" className="hover:text-white">Segurança</Link></li>
              <li><Link href="/contato" className="hover:text-white">Dúvidas frequentes</Link></li>
            </ul>
          </div>

          <div id="newsletter" className="scroll-mt-24">
            <h3 className="font-heading text-xs uppercase tracking-[0.2em] text-white/50">
              Newsletter
            </h3>
            <p className="mt-4 text-sm text-white/75">
              Receba novidades e ofertas exclusivas.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                className="w-full border border-white/25 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Cadastrar e-mail"
                className="shrink-0 border border-white bg-white px-3 text-black transition-opacity hover:opacity-85"
              >
                →
              </button>
            </form>
            {sent && (
              <p className="mt-2 text-xs text-white/60">
                Cadastrado. Você recebe nossas novidades em primeira mão.
              </p>
            )}
          </div>
        </div>

        <div className="mt-14 border-t border-white/15 pt-6 text-xs text-white/50">
          © 2026 UNIQUENESS SPORTS. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
