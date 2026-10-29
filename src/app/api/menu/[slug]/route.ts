import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug, active: true },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          dishes: {
            where: { available: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!restaurant) {
    return Response.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  return Response.json(restaurant);
}
