import { prisma } from "@/lib/prisma";
import { requireRoles, jsonError } from "@/lib/tenant";
import { SubscriptionStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";

export async function GET() {
  try {
    await requireRoles(["SUPER_ADMIN"]);
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { tables: true, dishes: true, users: true } },
      },
    });
    return Response.json(restaurants);
  } catch (e) {
    return jsonError(e);
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  city: z.string().optional(),
  department: z.string().optional(),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    await requireRoles(["SUPER_ADMIN"]);
    const body = createSchema.parse(await req.json());

    const restaurant = await prisma.restaurant.create({
      data: {
        name: body.name,
        slug: body.slug,
        city: body.city || "El Banco",
        department: body.department || "Magdalena",
        subscriptionStatus: SubscriptionStatus.PRUEBA,
        users: {
          create: {
            name: body.ownerName,
            email: body.ownerEmail.toLowerCase(),
            passwordHash: await hash(body.ownerPassword, 10),
            role: "OWNER",
          },
        },
      },
    });
    return Response.json(restaurant, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireRoles(["SUPER_ADMIN"]);
    const body = z
      .object({
        id: z.string(),
        subscriptionStatus: z.nativeEnum(SubscriptionStatus).optional(),
        active: z.boolean().optional(),
      })
      .parse(await req.json());
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
