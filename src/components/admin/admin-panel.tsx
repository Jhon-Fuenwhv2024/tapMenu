"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { TapMenuLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCops, tableUrl } from "@/lib/utils";

type Dish = {
  id: string;
  name: string;
  description: string | null;
  priceCops: number;
  imageUrl: string | null;
  modelGlbUrl: string | null;
  soldOut: boolean;
  available: boolean;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
  dishes: Dish[];
};

type Table = { id: string; code: string; label: string };

type Staff = { id: string; name: string; email: string; role: string };

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string;
  department: string;
  phone: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  categories: Category[];
  tables: Table[];
  users: Staff[];
};

type Dash = {
  ventasDelDia: number;
  pedidosDelDia: number;
  topDishes: { name: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  mesasActivas: number;
};

const tabs = [
  "tablero",
  "perfil",
  "carta",
  "mesas",
  "equipo",
] as const;

export function AdminPanel({ restaurant: initial }: { restaurant: Restaurant }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("tablero");
  const [resto, setResto] = useState(initial);
  const [dash, setDash] = useState<Dash | null>(null);
  const [msg, setMsg] = useState("");

  const reload = useCallback(async () => {
    const res = await fetch(`/api/admin/restaurant?id=${resto.id}`);
    if (res.ok) setResto(await res.json());
  }, [resto.id]);

  useEffect(() => {
    fetch(`/api/admin/dashboard/${resto.id}`)
      .then((r) => r.json())
      .then(setDash)
      .catch(() => {});
  }, [resto.id]);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/restaurant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: resto.id,
        name: fd.get("name"),
        description: fd.get("description"),
        address: fd.get("address"),
        city: fd.get("city"),
        department: fd.get("department"),
        phone: fd.get("phone"),
        primaryColor: fd.get("primaryColor"),
        accentColor: fd.get("accentColor"),
        logoUrl: fd.get("logoUrl") || null,
      }),
    });
    if (res.ok) {
      setMsg("Perfil guardado");
      await reload();
    }
  }

  async function addCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: resto.id,
        name: fd.get("name"),
      }),
    });
    e.currentTarget.reset();
    await reload();
  }

  async function addDish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/admin/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: resto.id,
        categoryId: fd.get("categoryId"),
        name: fd.get("name"),
        description: fd.get("description"),
        priceCops: Number(fd.get("priceCops")),
        imageUrl: fd.get("imageUrl") || undefined,
        modelGlbUrl: fd.get("modelGlbUrl") || undefined,
      }),
    });
    e.currentTarget.reset();
    setMsg("Plato creado");
    await reload();
  }

  async function toggleSoldOut(dish: Dish) {
    await fetch("/api/admin/dishes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dish.id, soldOut: !dish.soldOut }),
    });
    await reload();
  }

  async function uploadFile(
    file: File,
    folder: string
  ): Promise<string | null> {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url as string;
  }

  async function addTable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/admin/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: resto.id,
        label: fd.get("label"),
      }),
    });
    e.currentTarget.reset();
    await reload();
  }

  async function addStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: resto.id,
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        role: fd.get("role"),
      }),
    });
    e.currentTarget.reset();
    setMsg("Usuario creado");
    await reload();
  }

  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/5 bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <TapMenuLogo size="sm" />
            <p className="text-sm text-[var(--muted)]">{resto.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/cocina/${resto.id}`}>Cocina</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/staff/${resto.id}`}>Meseros</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/r/${resto.slug}/m/${resto.tables[0]?.code || "t1"}`}>
                Ver menú
              </Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
              Salir
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3">
          {tabs.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? "default" : "ghost"}
              onClick={() => setTab(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {msg && (
          <p className="mb-4 rounded-xl bg-[var(--brand-soft)] px-3 py-2 text-sm text-[var(--brand)]">
            {msg}
          </p>
        )}

        {tab === "tablero" && (
          <section className="animate-fade-up">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--brand)]">
              Tablero del día
            </h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat label="Ventas del día" value={formatCops(dash?.ventasDelDia || 0)} />
              <Stat label="Pedidos" value={String(dash?.pedidosDelDia || 0)} />
              <Stat label="Mesas activas" value={String(dash?.mesasActivas || 0)} />
            </div>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="font-semibold">Platos más pedidos</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {(dash?.topDishes || []).map((d) => (
                    <li key={d.name} className="flex justify-between">
                      <span>{d.name}</span>
                      <span className="font-medium text-[var(--brand)]">{d.count}</span>
                    </li>
                  ))}
                  {!dash?.topDishes?.length && (
                    <li className="text-[var(--muted)]">Sin pedidos aún hoy.</li>
                  )}
                </ul>
              </div>
              <div>
                <h2 className="font-semibold">Horas pico</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {(dash?.peakHours || []).slice(0, 5).map((h) => (
                    <li key={h.hour} className="flex justify-between">
                      <span>
                        {String(h.hour).padStart(2, "0")}:00
                      </span>
                      <span>{h.count} pedidos</span>
                    </li>
                  ))}
                  {!dash?.peakHours?.length && (
                    <li className="text-[var(--muted)]">Sin datos aún.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        )}

        {tab === "perfil" && (
          <section className="animate-fade-up max-w-lg">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              Perfil y marca
            </h1>
            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <Field label="Nombre" name="name" defaultValue={resto.name} />
              <Field
                label="Descripción"
                name="description"
                defaultValue={resto.description || ""}
              />
              <Field label="Dirección" name="address" defaultValue={resto.address || ""} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ciudad" name="city" defaultValue={resto.city} />
                <Field
                  label="Departamento"
                  name="department"
                  defaultValue={resto.department}
                />
              </div>
              <Field label="Teléfono" name="phone" defaultValue={resto.phone || ""} />
              <Field label="URL logo" name="logoUrl" defaultValue={resto.logoUrl || ""} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Color principal</Label>
                  <Input
                    type="color"
                    name="primaryColor"
                    defaultValue={resto.primaryColor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color acento</Label>
                  <Input
                    type="color"
                    name="accentColor"
                    defaultValue={resto.accentColor}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subir logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await uploadFile(f, "logos");
                    if (url) {
                      await fetch("/api/admin/restaurant", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: resto.id, logoUrl: url }),
                      });
                      setMsg("Logo actualizado");
                      await reload();
                    }
                  }}
                />
              </div>
              <Button type="submit">Guardar</Button>
            </form>
          </section>
        )}

        {tab === "carta" && (
          <section className="animate-fade-up">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              Carta
            </h1>
            <form onSubmit={addCategory} className="mt-4 flex gap-2">
              <Input name="name" placeholder="Nueva categoría" required />
              <Button type="submit">Agregar</Button>
            </form>

            <form
              onSubmit={addDish}
              className="mt-6 grid gap-3 rounded-2xl bg-[var(--surface)] p-4 ring-1 ring-black/5 sm:grid-cols-2"
            >
              <h2 className="sm:col-span-2 font-semibold">Nuevo plato</h2>
              <select
                name="categoryId"
                required
                className="h-11 rounded-xl border border-black/10 px-3 text-sm"
              >
                {resto.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Input name="name" placeholder="Nombre" required />
              <Input name="description" placeholder="Descripción" />
              <Input
                name="priceCops"
                type="number"
                placeholder="Precio COP"
                required
              />
              <Input name="imageUrl" placeholder="URL imagen (opcional)" />
              <Input name="modelGlbUrl" placeholder="URL modelo GLB 4D (opcional)" />
              <div className="sm:col-span-2">
                <Label className="mb-2 block">Subir imagen</Label>
                <Input
                  type="file"
                  accept="image/*,.glb,.usdz"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const isModel = f.name.endsWith(".glb") || f.name.endsWith(".usdz");
                    const url = await uploadFile(f, isModel ? "models" : "dishes");
                    if (!url) return;
                    const form = e.currentTarget.form;
                    if (!form) return;
                    if (isModel) {
                      (form.elements.namedItem("modelGlbUrl") as HTMLInputElement).value =
                        url;
                    } else {
                      (form.elements.namedItem("imageUrl") as HTMLInputElement).value =
                        url;
                    }
                    setMsg(`Archivo subido: ${url}`);
                  }}
                />
              </div>
              <Button type="submit" className="sm:col-span-2">
                Crear plato
              </Button>
            </form>

            <div className="mt-8 space-y-6">
              {resto.categories.map((c) => (
                <div key={c.id}>
                  <h2 className="text-lg font-semibold">{c.name}</h2>
                  <ul className="mt-2 divide-y divide-black/5">
                    {c.dishes.map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3"
                      >
                        <div>
                          <p className="font-medium">
                            {d.name}{" "}
                            {d.modelGlbUrl && (
                              <span className="text-xs text-[var(--accent)]">4D</span>
                            )}
                          </p>
                          <p className="text-sm text-[var(--brand)]">
                            {formatCops(d.priceCops)}
                            {d.soldOut ? " · Agotado" : ""}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => toggleSoldOut(d)}>
                          {d.soldOut ? "Marcar disponible" : "Marcar agotado"}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "mesas" && (
          <section className="animate-fade-up">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              Mesas · NFC y QR
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Escribe la URL de cada mesa en el tag NFC (NTAG213/215) con la app
              NFC Tools. Imprime el PDF de tarjetas con QR.
            </p>
            <form onSubmit={addTable} className="mt-4 flex gap-2">
              <Input name="label" placeholder="Mesa 7" required />
              <Button type="submit">Crear mesa</Button>
            </form>
            <div className="mt-4">
              <Button asChild variant="accent">
                <a href={`/api/qr/${resto.slug}?format=pdf`} target="_blank">
                  Descargar PDF de QR
                </a>
              </Button>
            </div>
            <ul className="mt-6 space-y-3">
              {resto.tables.map((t) => {
                const url = tableUrl(resto.slug, t.code, base);
                return (
                  <li
                    key={t.id}
                    className="rounded-2xl bg-[var(--surface)] p-4 ring-1 ring-black/5"
                  >
                    <p className="font-semibold">{t.label}</p>
                    <p className="mt-1 break-all text-xs text-[var(--muted)]">{url}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={url} target="_blank">
                          Abrir
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                          setMsg("URL copiada — pégala en NFC Tools");
                        }}
                      >
                        Copiar URL NFC
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {tab === "equipo" && (
          <section className="animate-fade-up max-w-lg">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              Equipo
            </h1>
            <ul className="mt-4 space-y-2 text-sm">
              {resto.users.map((u) => (
                <li key={u.id} className="flex justify-between">
                  <span>
                    {u.name} · {u.email}
                  </span>
                  <span className="font-medium text-[var(--brand)]">{u.role}</span>
                </li>
              ))}
            </ul>
            <form onSubmit={addStaff} className="mt-6 space-y-3">
              <Field label="Nombre" name="name" required />
              <Field label="Correo" name="email" type="email" required />
              <Field label="Contraseña" name="password" type="password" required />
              <div className="space-y-2">
                <Label>Rol</Label>
                <select
                  name="role"
                  className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm"
                >
                  <option value="MESERO">Mesero</option>
                  <option value="COCINA">Cocina</option>
                  <option value="OWNER">Dueño</option>
                </select>
              </div>
              <Button type="submit">Agregar</Button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface)] p-5 ring-1 ring-black/5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--brand)]">{value}</p>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
      />
    </div>
  );
}
