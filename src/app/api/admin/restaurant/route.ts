import { prisma } from "@/lib/prisma";
import { requireRoles, requireRestaurantAccess, jsonError } from "@/lib/tenant";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const session = await requireRoles(["OWNER", "SUPER_ADMIN", "COCINA", "MESERO"]);
    const url = new URL(req.url);
    const id =
      url.searchParams.get("id") ||
      session.user.restaurantId ||
      undefined;
    if (!id) {
      return Response.json({ error: "Falta restaurant id" }, { status: 400 });
    }
    await requireRestaurantAccess(id);
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        categories: {
          orderBy: { sortOrder: "asc" },
          include: { dishes: { orderBy: { sortOrder: "asc" } } },
        },
        tables: { orderBy: { label: "asc" } },
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
    return Response.json(restaurant);
  } catch (e) {
    return jsonError(e);
  }
}

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireRoles(["OWNER", "SUPER_ADMIN"]);
    const body = updateSchema.parse(await req.json());
    await requireRestaurantAccess(body.id);
    const { id, ...data } = body;
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data,
    });
    return Response.json(restaurant);
  } catch (e) {
    return jsonError(e);
  }
}
