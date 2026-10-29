import { getServerSession } from "next-auth";
import { authOptions, assertRole } from "./auth";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new AuthError("No autenticado");
  return session;
}

export async function requireRoles(roles: Role[]) {
  const session = await requireSession();
  if (!assertRole(session.user.role, roles)) {
    throw new AuthError("Sin permiso", 403);
  }
  return session;
}

export async function requireRestaurantAccess(restaurantId: string) {
  const session = await requireSession();
  if (session.user.role === "SUPER_ADMIN") return session;
  if (session.user.restaurantId !== restaurantId) {
    throw new AuthError("Tenant no autorizado", 403);
  }
  return session;
}

export async function getRestaurantBySlug(slug: string) {
  return prisma.restaurant.findUnique({ where: { slug, active: true } });
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function jsonError(err: unknown) {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: "Error interno" }, { status: 500 });
}
