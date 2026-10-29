import { prisma } from "@/lib/prisma";
import { realtime } from "@/lib/realtime";
import { requireRestaurantAccess, jsonError } from "@/lib/tenant";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const { alertId } = await params;
    const existing = await prisma.staffAlert.findUnique({
      where: { id: alertId },
    });
    if (!existing) {
      return Response.json({ error: "Alerta no encontrada" }, { status: 404 });
    }
    await requireRestaurantAccess(existing.restaurantId);

    const alert = await prisma.staffAlert.update({
      where: { id: alertId },
      data: { status: "ATENDIDA" },
      include: { session: { include: { table: true } } },
    });

    realtime.publish({
      type: "alert.updated",
      restaurantId: alert.restaurantId,
      payload: alert,
    });

    return Response.json(alert);
  } catch (e) {
    return jsonError(e);
  }
}
