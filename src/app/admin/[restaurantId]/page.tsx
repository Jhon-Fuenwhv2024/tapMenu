import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "@/components/admin/admin-panel";

export default async function AdminRestaurantPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (
    session.user.role !== "SUPER_ADMIN" &&
    !(
      session.user.role === "OWNER" &&
      session.user.restaurantId === restaurantId
    )
  ) {
    redirect("/admin");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: { dishes: { orderBy: { sortOrder: "asc" } } },
      },
      tables: { where: { active: true }, orderBy: { label: "asc" } },
      users: {
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!restaurant) redirect("/admin");

  return <AdminPanel restaurant={restaurant} />;
}
