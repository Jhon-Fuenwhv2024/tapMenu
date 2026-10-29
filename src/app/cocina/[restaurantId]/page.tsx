import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KdsBoard } from "@/components/kds/kds-board";

export default async function CocinaPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.restaurantId !== restaurantId
  ) {
    redirect("/admin");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
  if (!restaurant) redirect("/admin");

  return <KdsBoard restaurantId={restaurant.id} restaurantName={restaurant.name} />;
}
