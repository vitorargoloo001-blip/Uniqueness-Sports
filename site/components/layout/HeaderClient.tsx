"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { formatPrice } from "@/lib/format";
import { logoutAction } from "@/lib/auth-actions";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/produtos", label: "Produtos" },
  { href: "/colecoes", label: "Coleções" },
  { href: "/lifestyle", label: "Lifestyle" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

type CartItem = {
  id: string;
  quantity: number;
  product: { name: string; price: number };
};

type Session = { user: { name?: string | null; email?: string | null; role: string } } | null;

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.6-3.6 4.8-5.5 8-5.5s6.4 1.9 8 5.5" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  );
}

export default function HeaderClient({
  session,
  itemCount,
  items,
  subtotal,
}: {
  session: Session;
  itemCount: number;
  items: CartItem[];
  subtotal: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
      setAccountOpen(false);
      router.refresh();
    });
  }

  function submitSearch(e: FormEvent, query: string) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/busca?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  function toggleSearch() {
    setSearchOpen((v) => {
      const next = !v;
      if (next) requestAnimationFrame(() => searchInputRef.current?.focus());
      return next;
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
          <Image
            src="/identidade/logo-icone.png"
            alt="Uniqueness Sports"
            width={36}
            height={36}
            className="h-8 w-auto brightness-0"
            priority
          />
          <span className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-ink">
            Uniqueness Sports
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-heading text-xs uppercase tracking-[0.16em] text-ink/75 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <button
              type="button"
              aria-label="Buscar"
              aria-expanded={searchOpen}
              onClick={toggleSearch}
              className="text-ink/70 transition-colors hover:text-ink"
            >
              <SearchIcon />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-full mt-3 w-72 border border-border bg-surface p-3 shadow-lg">
                <form onSubmit={(e) => submitSearch(e, searchQuery)} className="flex gap-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                    placeholder="Buscar produtos..."
                    className="w-full border border-border bg-transparent px-3 py-2 text-sm text-ink placeholder:text-gray focus:border-ink focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Buscar"
                    className="shrink-0 border border-ink px-3 text-ink transition-colors hover:bg-ink hover:text-white"
                  >
                    <SearchIcon />
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="relative hidden sm:block">
            <button
              type="button"
              aria-label="Conta"
              onClick={() => setAccountOpen((v) => !v)}
              className="text-ink/70 transition-colors hover:text-ink"
            >
              <UserIcon />
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-full mt-3 w-56 border border-border bg-surface p-2 shadow-lg">
                {session ? (
                  <>
                    <p className="px-3 py-2 text-xs text-gray">
                      {session.user.name || session.user.email}
                    </p>
                    <Link
                      href="/minha-conta"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-2 text-sm text-ink hover:bg-[#F7F5F0]"
                    >
                      Minha conta
                    </Link>
                    <Link
                      href="/minha-conta/pedidos"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-2 text-sm text-ink hover:bg-[#F7F5F0]"
                    >
                      Meus pedidos
                    </Link>
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="block px-3 py-2 text-sm text-ink hover:bg-[#F7F5F0]"
                      >
                        Painel admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isPending}
                      className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-[#F7F5F0]"
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-2 text-sm text-ink hover:bg-[#F7F5F0]"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/cadastro"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-2 text-sm text-ink hover:bg-[#F7F5F0]"
                    >
                      Criar conta
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              aria-label="Carrinho"
              onClick={() => setCartOpen((v) => !v)}
              className="relative text-ink/70 transition-colors hover:text-ink"
            >
              <BagIcon />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] text-white">
                  {itemCount}
                </span>
              )}
            </button>

            {cartOpen && (
              <div className="absolute right-0 top-full mt-3 w-80 border border-border bg-surface p-4 shadow-lg">
                {items.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray">Carrinho vazio</p>
                ) : (
                  <>
                    <ul className="max-h-64 space-y-3 overflow-y-auto">
                      {items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3 text-sm">
                          <span className="text-ink">
                            {item.quantity}× {item.product.name}
                          </span>
                          <span className="text-ink/70">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex justify-between border-t border-border pt-3 font-heading text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      <Link
                        href="/carrinho"
                        onClick={() => setCartOpen(false)}
                        className="border border-ink px-4 py-2 text-center font-heading text-xs uppercase tracking-[0.14em] text-ink hover:bg-[#F7F5F0]"
                      >
                        Ver carrinho
                      </Link>
                      <Link
                        href="/checkout"
                        onClick={() => setCartOpen(false)}
                        className="bg-ink px-4 py-2 text-center font-heading text-xs uppercase tracking-[0.14em] text-white hover:opacity-85"
                      >
                        Finalizar compra
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex flex-col gap-1.5 lg:hidden"
          >
            <span className="h-[1.5px] w-6 bg-ink" />
            <span className="h-[1.5px] w-6 bg-ink" />
            <span className="h-[1.5px] w-4 self-end bg-ink" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-5 pb-5 lg:hidden">
          <form
            onSubmit={(e) => submitSearch(e, mobileSearchQuery)}
            className="flex gap-2 border-b border-border py-3 sm:hidden"
          >
            <input
              type="text"
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full border border-border bg-transparent px-3 py-2 text-sm text-ink placeholder:text-gray focus:border-ink focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="shrink-0 border border-ink px-3 text-ink transition-colors hover:bg-ink hover:text-white"
            >
              <SearchIcon />
            </button>
          </form>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-border py-3 font-heading text-xs uppercase tracking-[0.16em] text-ink/80"
            >
              {link.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link
                href="/minha-conta"
                onClick={() => setMenuOpen(false)}
                className="border-b border-border py-3 font-heading text-xs uppercase tracking-[0.16em] text-ink/80"
              >
                Minha conta
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="py-3 text-left font-heading text-xs uppercase tracking-[0.16em] text-ink/80"
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="py-3 font-heading text-xs uppercase tracking-[0.16em] text-ink/80"
            >
              Entrar
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
