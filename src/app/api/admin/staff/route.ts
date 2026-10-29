import { prisma } from "@/lib/prisma";
import { requireRoles, requireRestaurantAccess, jsonError } from "@/lib/tenant";
import { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    await requireRoles(["OWNER", "SUPER_ADMIN"]);
    const body = z
      .object({
        restaurantId: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["OWNER", "COCINA", "MESERO"]),
      })
      .parse(await req.json());
    await requireRestaurantAccess(body.restaurantId);

    const user = await prisma.user.create({
      data: {
        restaurantId: body.restaurantId,
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash: await hash(body.password, 10),
        role: body.role as Role,
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return Response.json(user, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
