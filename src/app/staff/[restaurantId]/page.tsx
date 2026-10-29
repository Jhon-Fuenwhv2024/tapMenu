import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StaffBoard } from "@/components/staff/staff-board";

export default async function StaffPage({
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

  return (
    <StaffBoard restaurantId={restaurant.id} restaurantName={restaurant.name} />
  );
}
