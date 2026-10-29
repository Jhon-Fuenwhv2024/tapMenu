import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SuperAdminPanel } from "@/components/admin/super-admin-panel";

export default async function SuperPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/admin");

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tables: true, dishes: true, users: true } },
    },
  });

  return (
    <SuperAdminPanel
      adminName={session.user.name}
      initialRestaurants={restaurants}
    />
  );
}
