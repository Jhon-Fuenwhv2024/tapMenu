import { prisma } from "@/lib/prisma";
import { requireRestaurantAccess, jsonError } from "@/lib/tenant";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params;
    await requireRestaurantAccess(restaurantId);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: start },
        status: { not: "CANCELADO" },
      },
      include: {
        items: { include: { dish: true } },
      },
    });

    let ventas = 0;
    const dishCount = new Map<string, { name: string; count: number }>();
    const hourCount = new Map<number, number>();

    for (const o of orders) {
      const hour = o.createdAt.getHours();
      hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
      for (const i of o.items) {
        ventas += i.unitPrice * i.quantity;
        const prev = dishCount.get(i.dishId) || {
          name: i.dish.name,
          count: 0,
        };
        prev.count += i.quantity;
        dishCount.set(i.dishId, prev);
      }
    }

    const topDishes = Array.from(dishCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const peakHours = Array.from(hourCount.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count);

    const mesasActivas = await prisma.tableSession.count({
      where: { restaurantId, open: true },
    });

    return Response.json({
      ventasDelDia: ventas,
      pedidosDelDia: orders.length,
      topDishes,
      peakHours,
      mesasActivas,
    });
  } catch (e) {
    return jsonError(e);
  }
}
