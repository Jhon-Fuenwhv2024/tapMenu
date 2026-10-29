import { prisma } from "@/lib/prisma";
import { requireRoles, requireRestaurantAccess, jsonError } from "@/lib/tenant";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    await requireRoles(["OWNER", "SUPER_ADMIN"]);
    const body = z
      .object({
        restaurantId: z.string(),
        name: z.string().min(1),
        sortOrder: z.number().int().optional(),
      })
      .parse(await req.json());
    await requireRestaurantAccess(body.restaurantId);
    const category = await prisma.category.create({ data: body });
    return Response.json(category, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
