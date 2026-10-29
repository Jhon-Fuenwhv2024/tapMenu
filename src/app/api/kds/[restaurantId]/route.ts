import { prisma } from "@/lib/prisma";
import { requireRestaurantAccess, jsonError } from "@/lib/tenant";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params;
    await requireRestaurantAccess(restaurantId);

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ["RECIBIDO", "EN_PREPARACION", "LISTO"] },
      },
      include: {
        items: { include: { dish: true, diner: true } },
        session: { include: { table: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const alerts = await prisma.staffAlert.findMany({
      where: { restaurantId, status: "PENDIENTE" },
      include: { session: { include: { table: true } } },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ orders, alerts });
  } catch (e) {
    return jsonError(e);
  }
}
