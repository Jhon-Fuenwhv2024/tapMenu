import { prisma } from "@/lib/prisma";
import { splitBill } from "@/lib/bill-split";
import { getPaymentProvider, PAYMENT_METHOD_LABELS } from "@/lib/payments";
import { realtime } from "@/lib/realtime";
import { PaymentMethod, SplitMode } from "@prisma/client";
import { z } from "zod";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await prisma.tableSession.findUnique({
    where: { id: sessionId },
    include: {
      diners: true,
      table: true,
      restaurant: true,
      orders: {
        where: { status: { not: "CANCELADO" } },
        include: {
          items: { include: { dish: true, diner: true } },
        },
      },
      payments: true,
    },
  });
  if (!session) {
    return Response.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  const items = session.orders.flatMap((o) =>
    o.items.map((i) => ({
      id: i.id,
      dinerId: i.dinerId,
      dinerName: i.diner?.name || "Sin nombre",
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      dishName: i.dish.name,
    }))
  );

  const shares = splitBill(
    items,
    session.splitMode,
    session.tipPercent,
    session.diners.map((d) => d.name)
  );

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tip = Math.round((subtotal * session.tipPercent) / 100);

  return Response.json({
    session,
    items,
    shares,
    subtotal,
    tip,
    total: subtotal + tip,
    paymentMethods: Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  });
}

const patchSchema = z.object({
  tipPercent: z.number().int().min(0).max(30).optional(),
  splitMode: z.nativeEnum(SplitMode).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = patchSchema.parse(await req.json());
  const session = await prisma.tableSession.update({
    where: { id: sessionId },
    data: {
      tipPercent: body.tipPercent,
      splitMode: body.splitMode,
    },
  });
  realtime.publish({
    type: "session.updated",
    restaurantId: session.restaurantId,
    payload: session,
  });
  return Response.json(session);
}

const paySchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  dinerName: z.string().optional(),
  amountCops: z.number().int().positive(),
  tipCops: z.number().int().min(0).default(0),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = paySchema.parse(await req.json());
  const session = await prisma.tableSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    return Response.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  const provider = getPaymentProvider();
  const intent = await provider.createIntent({
    amountCops: body.amountCops,
    tipCops: body.tipCops,
    method: body.method,
    dinerName: body.dinerName,
  });

  const payment = await prisma.payment.create({
    data: {
      restaurantId: session.restaurantId,
      sessionId: session.id,
      dinerName: body.dinerName,
      method: body.method,
      amountCops: body.amountCops,
      tipCops: body.tipCops,
      status: intent.status,
      providerRef: intent.providerRef,
    },
  });

  realtime.publish({
    type: "payment.updated",
    restaurantId: session.restaurantId,
    payload: payment,
  });

  return Response.json({ payment, intent }, { status: 201 });
}
