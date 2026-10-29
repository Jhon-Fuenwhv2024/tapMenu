import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { realtime } from "@/lib/realtime";
import { requireRestaurantAccess, jsonError } from "@/lib/tenant";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const existing = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!existing) {
      return Response.json({ error: "Pago no encontrado" }, { status: 404 });
    }
    await requireRestaurantAccess(existing.restaurantId);

    const provider = getPaymentProvider();
    const result = await provider.confirm(existing.providerRef || paymentId);

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: result.status },
    });

    // Si todos los pagos cubren la cuenta, cerrar sesión (simplificado)
    const session = await prisma.tableSession.findUnique({
      where: { id: payment.sessionId },
      include: {
        payments: true,
        orders: { include: { items: true } },
      },
    });
    if (session) {
      const subtotal = session.orders
        .filter((o) => o.status !== "CANCELADO")
        .flatMap((o) => o.items)
        .reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const tip = Math.round((subtotal * session.tipPercent) / 100);
      const paid = session.payments
        .filter((p) => p.status === "CONFIRMADO" || p.id === payment.id)
        .reduce((s, p) => s + p.amountCops + p.tipCops, 0);
      if (paid >= subtotal + tip) {
        await prisma.tableSession.update({
          where: { id: session.id },
          data: { open: false, closedAt: new Date() },
        });
      }
    }

    realtime.publish({
      type: "payment.updated",
      restaurantId: payment.restaurantId,
      payload: payment,
    });

    return Response.json(payment);
  } catch (e) {
    return jsonError(e);
  }
}
