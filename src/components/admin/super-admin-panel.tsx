"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { TapMenuLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Resto = {
  id: string;
  name: string;
  slug: string;
  city: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  active: boolean;
  _count: { tables: number; dishes: number; users: number };
};

export function SuperAdminPanel({
  adminName,
  initialRestaurants,
}: {
  adminName: string;
  initialRestaurants: Resto[];
}) {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [msg, setMsg] = useState("");

  async function refresh() {
    const res = await fetch("/api/super/restaurants");
    if (res.ok) setRestaurants(await res.json());
  }

  async function createResto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/super/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        slug: fd.get("slug"),
        city: fd.get("city"),
        department: fd.get("department"),
        ownerName: fd.get("ownerName"),
        ownerEmail: fd.get("ownerEmail"),
        ownerPassword: fd.get("ownerPassword"),
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setMsg(d.error || "Error al crear");
      return;
    }
    e.currentTarget.reset();
    setMsg("Restaurante creado");
    await refresh();
  }

  async function setStatus(id: string, subscriptionStatus: string) {
    await fetch("/api/super/restaurants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, subscriptionStatus }),
    });
    await refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/5 bg-[var(--surface)] px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <TapMenuLogo size="sm" />
            <p className="text-sm text-[var(--muted)]">
              Super-admin · {adminName}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--brand)]">
          Restaurantes
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Plan mensual · aislamiento multi-tenant por restaurantId
        </p>

        {msg && (
          <p className="mt-4 rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-sm text-[var(--brand)]">
            {msg}
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {restaurants.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--surface)] p-4 ring-1 ring-black/5"
            >
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  /{r.slug} · {r.city} · {r._count.tables} mesas ·{" "}
                  {r._count.dishes} platos · plan {r.subscriptionPlan} ·{" "}
                  {r.subscriptionStatus}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/${r.id}`}>Admin</Link>
                </Button>
                <select
                  className="h-9 rounded-lg border border-black/10 px-2 text-xs"
                  value={r.subscriptionStatus}
                  onChange={(e) => setStatus(r.id, e.target.value)}
                >
                  <option value="PRUEBA">PRUEBA</option>
                  <option value="ACTIVA">ACTIVA</option>
                  <option value="SUSPENDIDA">SUSPENDIDA</option>
                  <option value="CANCELADA">CANCELADA</option>
                </select>
              </div>
            </li>
          ))}
        </ul>

        <form
          onSubmit={createResto}
          className="mt-10 max-w-lg space-y-3 rounded-2xl bg-[var(--surface)] p-5 ring-1 ring-black/5"
        >
          <h2 className="font-semibold">Nuevo restaurante</h2>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-2">
            <Label>Slug (url)</Label>
            <Input name="slug" placeholder="mi-cafe" pattern="[a-z0-9-]+" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input name="city" defaultValue="El Banco" />
            </div>
            <div className="space-y-2">
              <Label>Depto.</Label>
              <Input name="department" defaultValue="Magdalena" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dueño</Label>
            <Input name="ownerName" required />
          </div>
          <div className="space-y-2">
            <Label>Correo dueño</Label>
            <Input name="ownerEmail" type="email" required />
          </div>
          <div className="space-y-2">
            <Label>Contraseña dueño</Label>
            <Input name="ownerPassword" type="password" required minLength={6} />
          </div>
          <Button type="submit">Crear tenant</Button>
        </form>
      </main>
    </div>
  );
}
