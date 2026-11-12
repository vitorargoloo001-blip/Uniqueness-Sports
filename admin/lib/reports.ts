import "server-only";
import { prisma } from "@/lib/prisma";

export async function getReportsData() {
  const since12m = new Date();
  since12m.setMonth(since12m.getMonth() - 11);
  since12m.setDate(1);
  since12m.setHours(0, 0, 0, 0);

  const [paidOrders, orderItems, ordersByPaymentStatus] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: since12m } },
      select: { total: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      _count: { _all: true },
    }),
  ]);

  const revenueByMonth = new Map<string, number>();
  for (const order of paidOrders) {
    const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(order.total));
  }

  const monthlyRevenue: { month: string; total: number }[] = [];
  const cursor = new Date(since12m);
  for (let i = 0; i < 12; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue.push({ month: key, total: revenueByMonth.get(key) ?? 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const totalRevenue12m = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const averageOrderValue = paidOrders.length > 0 ? totalRevenue12m / paidOrders.length : 0;

  return {
    monthlyRevenue,
    totalRevenue12m,
    averageOrderValue,
    paidOrdersCount12m: paidOrders.length,
    topProducts: orderItems.map((row) => ({
      name: row.name,
      quantity: row._sum.quantity ?? 0,
      total: Number(row._sum.total ?? 0),
    })),
    ordersByPaymentStatus: ordersByPaymentStatus.map((row) => ({
      status: row.paymentStatus,
      count: row._count._all,
    })),
  };
}
