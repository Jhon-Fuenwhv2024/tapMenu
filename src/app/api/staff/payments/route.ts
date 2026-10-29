import { prisma } from "@/lib/prisma";
import { requireRestaurantAccess, jsonError } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const restaurantId = url.searchParams.get("restaurantId");
    if (!restaurantId) {
      return Response.json({ error: "restaurantId requerido" }, { status: 400 });
    }
    await requireRestaurantAccess(restaurantId);
    const payments = await prisma.payment.findMany({
      where: { restaurantId, status: "PENDIENTE" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json(payments);
  } catch (e) {
    return jsonError(e);
  }
}
