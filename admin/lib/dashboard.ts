import "server-only";
import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 10;

export async function getDashboardData() {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    revenueAgg,
    ordersByStatus,
    paidOrdersLast30d,
    lowStockProducts,
    newLeadsCount,
    recentOrders,
    productCount,
    customerCount,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: since30d } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      select: { id: true, name: true, stock: true, slug: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  const revenueByDay = new Map<string, number>();
  for (const order of paidOrdersLast30d) {
    const key = order.createdAt.toISOString().slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(order.total));
  }
  const salesChart = Array.from(revenueByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));

  const statusChart = ordersByStatus.map((row) => ({
    status: row.status,
    count: row._count._all,
  }));

  return {
    totalRevenue: Number(revenueAgg._sum.total ?? 0),
    paidOrdersCount: revenueAgg._count._all,
    pendingOrdersCount: statusChart.find((s) => s.status === "PENDING_PAYMENT")?.count ?? 0,
    productCount,
    customerCount,
    newLeadsCount,
    lowStockProducts,
    recentOrders,
    salesChart,
    statusChart,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
