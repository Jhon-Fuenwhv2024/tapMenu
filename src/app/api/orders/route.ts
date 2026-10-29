import { prisma } from "@/lib/prisma";
import { realtime } from "@/lib/realtime";
import { z } from "zod";

const createSchema = z.object({
  sessionId: z.string(),
  dinerId: z.string(),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        dishId: z.string(),
        quantity: z.number().int().min(1).max(20),
        note: z.string().optional(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const body = createSchema.parse(await req.json());

    const session = await prisma.tableSession.findUnique({
      where: { id: body.sessionId },
      include: { table: true, diners: true },
    });
    if (!session || !session.open) {
      return Response.json({ error: "Sesión cerrada o inválida" }, { status: 400 });
    }

    const diner = session.diners.find((d) => d.id === body.dinerId);
    if (!diner) {
      return Response.json({ error: "Comensal no encontrado" }, { status: 400 });
    }

    const dishIds = body.items.map((i) => i.dishId);
    const dishes = await prisma.dish.findMany({
      where: {
        id: { in: dishIds },
        restaurantId: session.restaurantId,
        available: true,
        soldOut: false,
      },
    });
    if (dishes.length !== dishIds.length) {
      return Response.json(
        { error: "Uno o más platos no están disponibles" },
        { status: 400 }
      );
    }
    const byId = Object.fromEntries(dishes.map((d) => [d.id, d]));

    const order = await prisma.order.create({
      data: {
        restaurantId: session.restaurantId,
        sessionId: session.id,
        note: body.note,
        status: "RECIBIDO",
        items: {
          create: body.items.map((i) => ({
            dishId: i.dishId,
            quantity: i.quantity,
            unitPrice: byId[i.dishId].priceCops,
            note: i.note,
            dinerId: diner.id,
          })),
        },
      },
      include: {
        items: { include: { dish: true, diner: true } },
        session: { include: { table: true } },
      },
    });

    realtime.publish({
      type: "order.created",
      restaurantId: session.restaurantId,
      payload: order,
    });

    return Response.json(order, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: e.flatten() }, { status: 400 });
    }
    console.error(e);
    return Response.json({ error: "Error al crear pedido" }, { status: 500 });
  }
}
