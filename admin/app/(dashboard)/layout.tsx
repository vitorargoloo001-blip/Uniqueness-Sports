import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { getFlowCounts } from "@/lib/fluxo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const flowCounts = await getFlowCounts();

  return (
    <SidebarProvider>
      <AppSidebar flowCounts={flowCounts} />
      <SidebarInset>
        <SiteHeader user={{ name: session.user.name ?? null, email: session.user.email ?? "" }} />
        <main className="flex-1 space-y-6 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
