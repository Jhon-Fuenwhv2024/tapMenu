import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/super");
  }

  const restaurantId = session.user.restaurantId;
  if (!restaurantId) redirect("/login");

  if (session.user.role === "COCINA") {
    redirect(`/cocina/${restaurantId}`);
  }
  if (session.user.role === "MESERO") {
    redirect(`/staff/${restaurantId}`);
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
  if (!restaurant) redirect("/login");

  redirect(`/admin/${restaurant.id}`);
}
