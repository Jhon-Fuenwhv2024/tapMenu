import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CustomerMenu } from "@/components/menu/customer-menu";

export default async function TableMenuPage({
  params,
}: {
  params: Promise<{ slug: string; tableCode: string }>;
}) {
  const { slug, tableCode } = await params;

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
      tables: { where: { code: tableCode, active: true } },
    },
  });

  if (!restaurant || restaurant.tables.length === 0) notFound();
  const table = restaurant.tables[0];

  return (
    <CustomerMenu
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        primaryColor: restaurant.primaryColor,
        accentColor: restaurant.accentColor,
        logoUrl: restaurant.logoUrl,
      }}
      table={{ id: table.id, code: table.code, label: table.label }}
      categories={restaurant.categories.map((c) => ({
        id: c.id,
        name: c.name,
        dishes: c.dishes.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          priceCops: d.priceCops,
          imageUrl: d.imageUrl,
          modelGlbUrl: d.modelGlbUrl,
          modelUsdzUrl: d.modelUsdzUrl,
          soldOut: d.soldOut,
        })),
      }))}
    />
  );
}
