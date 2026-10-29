import { prisma } from "@/lib/prisma";
import { realtime } from "@/lib/realtime";
import { requireRestaurantAccess, jsonError } from "@/lib/tenant";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = schema.parse(await req.json());

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return Response.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    await requireRestaurantAccess(existing.restaurantId);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: body.status },
      include: {
        items: { include: { dish: true, diner: true } },
        session: { include: { table: true } },
      },
    });

    realtime.publish({
      type: "order.updated",
      restaurantId: order.restaurantId,
      payload: order,
    });

    return Response.json(order);
  } catch (e) {
    return jsonError(e);
  }
}
