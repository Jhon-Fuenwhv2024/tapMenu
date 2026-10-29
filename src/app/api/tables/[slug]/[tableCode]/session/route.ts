import { prisma } from "@/lib/prisma";
import { realtime } from "@/lib/realtime";
import { z } from "zod";

async function getTable(slug: string, tableCode: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug, active: true },
  });
  if (!restaurant) return null;
  const table = await prisma.table.findUnique({
    where: {
      restaurantId_code: { restaurantId: restaurant.id, code: tableCode },
    },
  });
  if (!table || !table.active) return null;
  return { restaurant, table };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; tableCode: string }> }
) {
  const { slug, tableCode } = await params;
  const ctx = await getTable(slug, tableCode);
  if (!ctx) {
    return Response.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  let session = await prisma.tableSession.findFirst({
    where: { tableId: ctx.table.id, open: true },
    include: {
      diners: true,
      orders: {
        include: {
          items: { include: { dish: true, diner: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      payments: true,
      alerts: { where: { status: "PENDIENTE" } },
    },
  });

  if (!session) {
    session = await prisma.tableSession.create({
      data: {
        restaurantId: ctx.restaurant.id,
        tableId: ctx.table.id,
      },
      include: {
        diners: true,
        orders: {
          include: {
            items: { include: { dish: true, diner: true } },
          },
        },
        payments: true,
        alerts: true,
      },
    });
  }

  return Response.json({
    restaurant: ctx.restaurant,
    table: ctx.table,
    session,
  });
}

const joinSchema = z.object({
  name: z.string().min(1).max(40),
  clientKey: z.string().min(4).max(64),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; tableCode: string }> }
) {
  const { slug, tableCode } = await params;
  const ctx = await getTable(slug, tableCode);
  if (!ctx) {
    return Response.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  const body = joinSchema.parse(await req.json());

  let session = await prisma.tableSession.findFirst({
    where: { tableId: ctx.table.id, open: true },
  });
  if (!session) {
    session = await prisma.tableSession.create({
      data: {
        restaurantId: ctx.restaurant.id,
        tableId: ctx.table.id,
      },
    });
  }

  const diner = await prisma.sessionDiner.upsert({
    where: {
      sessionId_clientKey: {
        sessionId: session.id,
        clientKey: body.clientKey,
      },
    },
    create: {
      sessionId: session.id,
      name: body.name.trim(),
      clientKey: body.clientKey,
    },
    update: { name: body.name.trim() },
  });

  realtime.publish({
    type: "session.updated",
    restaurantId: ctx.restaurant.id,
    payload: { sessionId: session.id, diner },
  });

  return Response.json({ sessionId: session.id, diner });
}
