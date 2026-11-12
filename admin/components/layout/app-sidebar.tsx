"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Ticket,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  PackagePlus,
  PackageOpen,
  Truck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { FlowStatus } from "@/lib/status";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; count?: FlowStatus };

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Geral",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    // Fluxo de envio (ver lib/fluxo.ts) — mesma ordem das abas das páginas.
    label: "Envios",
    items: [
      { href: "/pedidos/novos", label: "Pedidos novos", icon: PackagePlus, count: "PAID" },
      { href: "/pedidos/em-preparo", label: "Em preparo", icon: PackageOpen, count: "PROCESSING" },
      { href: "/pedidos/postados", label: "Postados", icon: Truck, count: "SHIPPED" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/produtos", label: "Produtos", icon: Package },
      { href: "/categorias", label: "Categorias", icon: FolderTree },
    ],
  },
  {
    label: "Vendas",
    items: [
      { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/cupons", label: "Cupons", icon: Ticket },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/banners", label: "Banners", icon: ImageIcon },
      { href: "/conteudo", label: "Conteúdo do site", icon: FileText },
      { href: "/demandas", label: "Demandas", icon: MessageSquare },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

/**
 * O item mais específico que casa com a URL — senão "/pedidos" acenderia
 * junto com "/pedidos/novos".
 */
function activeHref(pathname: string) {
  return NAV.flatMap((group) => group.items.map((item) => item.href))
    .filter((href) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length)[0];
}

export function AppSidebar({ flowCounts }: { flowCounts: Record<FlowStatus, number> }) {
  const pathname = usePathname();
  const active = activeHref(pathname);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link href="/" className="flex items-center gap-2 px-1">
          <Image
            src="/identidade/logo-icone.png"
            alt="Uniqueness Sports"
            width={28}
            height={28}
            className="size-7 shrink-0 brightness-0"
            priority
          />
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-foreground">Uniqueness Admin</span>
            <span className="text-[11px] text-muted-foreground">Painel operacional</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const count = item.count ? flowCounts[item.count] : 0;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={item.href === active} tooltip={item.label}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
