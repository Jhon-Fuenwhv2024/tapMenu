import { prisma } from "@/lib/prisma";
import { realtime } from "@/lib/realtime";
import { AlertType } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string(),
  type: z.nativeEnum(AlertType),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const session = await prisma.tableSession.findUnique({
      where: { id: body.sessionId },
      include: { table: true },
    });
    if (!session || !session.open) {
      return Response.json({ error: "Sesión inválida" }, { status: 400 });
    }

    const alert = await prisma.staffAlert.create({
      data: {
        restaurantId: session.restaurantId,
        sessionId: session.id,
        type: body.type,
        message:
          body.message ||
          (body.type === "MESERO" ? "Llaman al mesero" : "Piden la cuenta"),
      },
      include: { session: { include: { table: true } } },
    });

    realtime.publish({
      type: "alert.created",
      restaurantId: session.restaurantId,
      payload: alert,
    });

    return Response.json(alert, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error al crear alerta" }, { status: 500 });
  }
}
