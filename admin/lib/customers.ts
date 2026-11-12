import "server-only";
import { prisma } from "@/lib/prisma";

export async function listCustomers() {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: {
      orders: { select: { total: true, paymentStatus: true } },
      _count: { select: { orders: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    ordersCount: user._count.orders,
    totalSpent: user.orders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + Number(o.total), 0),
  }));
}

export async function getCustomer(id: string) {
  return prisma.user.findUnique({
    where: { id, role: "CUSTOMER" },
    include: {
      addresses: true,
      orders: { orderBy: { createdAt: "desc" } },
    },
  });
}
