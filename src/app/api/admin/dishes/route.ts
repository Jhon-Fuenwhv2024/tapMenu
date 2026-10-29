import { prisma } from "@/lib/prisma";
import { requireRoles, requireRestaurantAccess, jsonError } from "@/lib/tenant";
import { z } from "zod";

const schema = z.object({
  restaurantId: z.string(),
  categoryId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCops: z.number().int().positive(),
  imageUrl: z.string().optional(),
  modelGlbUrl: z.string().optional(),
  modelUsdzUrl: z.string().optional(),
  soldOut: z.boolean().optional(),
  available: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request) {
  try {
    await requireRoles(["OWNER", "SUPER_ADMIN"]);
    const body = schema.parse(await req.json());
    await requireRestaurantAccess(body.restaurantId);
    const dish = await prisma.dish.create({ data: body });
    return Response.json(dish, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireRoles(["OWNER", "SUPER_ADMIN"]);
    const body = schema.partial().extend({ id: z.string() }).parse(await req.json());
    const existing = await prisma.dish.findUnique({ where: { id: body.id } });
    if (!existing) {
      return Response.json({ error: "Plato no encontrado" }, { status: 404 });
    }
    await requireRestaurantAccess(existing.restaurantId);
    const { id, ...data } = body;
    const dish = await prisma.dish.update({ where: { id }, data });
    return Response.json(dish);
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRoles(["OWNER", "SUPER_ADMIN"]);
    const { id } = z.object({ id: z.string() }).parse(await req.json());
    const existing = await prisma.dish.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Plato no encontrado" }, { status: 404 });
    }
    await requireRestaurantAccess(existing.restaurantId);
    await prisma.dish.update({
      where: { id },
      data: { available: false },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
