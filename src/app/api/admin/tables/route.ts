import { prisma } from "@/lib/prisma";
import { requireRoles, requireRestaurantAccess, jsonError } from "@/lib/tenant";
import { z } from "zod";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    await requireRoles(["OWNER", "SUPER_ADMIN"]);
    const body = z
      .object({
        restaurantId: z.string(),
        label: z.string().min(1),
        code: z.string().optional(),
      })
      .parse(await req.json());
    await requireRestaurantAccess(body.restaurantId);
    const code = body.code || `t${nanoid(6)}`;
    const table = await prisma.table.create({
      data: {
        restaurantId: body.restaurantId,
        label: body.label,
        code,
      },
    });
    return Response.json(table, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRoles(["OWNER", "SUPER_ADMIN"]);
    const { id } = z.object({ id: z.string() }).parse(await req.json());
    const existing = await prisma.table.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Mesa no encontrada" }, { status: 404 });
    }
    await requireRestaurantAccess(existing.restaurantId);
    await prisma.table.update({ where: { id }, data: { active: false } });
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
