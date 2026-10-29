"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, Bell, Receipt, X, Plus, Minus, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCops } from "@/lib/utils";
import { ModelViewer } from "./model-viewer";

type Dish = {
  id: string;
  name: string;
  description: string | null;
  priceCops: number;
  imageUrl: string | null;
  modelGlbUrl: string | null;
  modelUsdzUrl: string | null;
  soldOut: boolean;
};

type Category = { id: string; name: string; dishes: Dish[] };

type CartItem = { dish: Dish; quantity: number };

function clientKey() {
  if (typeof window === "undefined") return "";
  const k = "tapmenu_client";
  let v = localStorage.getItem(k);
  if (!v) {
    v = `c_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(k, v);
  }
  return v;
}

export function CustomerMenu({
  restaurant,
  table,
  categories,
}: {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    primaryColor: string;
    accentColor: string;
    logoUrl: string | null;
  };
  table: { id: string; code: string; label: string };
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dinerId, setDinerId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<Dish | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");
  const [alertBusy, setAlertBusy] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--brand", restaurant.primaryColor);
    document.documentElement.style.setProperty("--accent", restaurant.accentColor);
    const saved = localStorage.getItem(`tapmenu_name_${restaurant.id}`);
    if (saved) setName(saved);
  }, [restaurant]);

  const join = useCallback(async () => {
    if (!name.trim()) return;
    localStorage.setItem(`tapmenu_name_${restaurant.id}`, name.trim());
    const res = await fetch(
      `/api/tables/${restaurant.slug}/${table.code}/session`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), clientKey: clientKey() }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setToast(data.error || "No se pudo unir a la mesa");
      return;
    }
    setSessionId(data.sessionId);
    setDinerId(data.diner.id);
    setJoined(true);
  }, [name, restaurant, table]);

  useEffect(() => {
    fetch(`/api/tables/${restaurant.slug}/${table.code}/session`)
      .then((r) => r.json())
      .then((data) => {
        if (data.session?.id) setSessionId(data.session.id);
      })
      .catch(() => {});
  }, [restaurant.slug, table.code]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        dishes: c.dishes.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            (d.description || "").toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.dishes.length > 0);
  }, [categories, query]);

  function addToCart(dish: Dish, qty = 1) {
    if (dish.soldOut) return;
    setCart((prev) => {
      const i = prev.findIndex((x) => x.dish.id === dish.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + qty };
        return next;
      }
      return [...prev, { dish, quantity: qty }];
    });
    setToast(`${dish.name} agregado`);
    setTimeout(() => setToast(""), 2000);
  }

  function setQty(dishId: string, quantity: number) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((x) => x.dish.id !== dishId)
        : prev.map((x) => (x.dish.id === dishId ? { ...x, quantity } : x))
    );
  }

  const cartTotal = cart.reduce(
    (s, i) => s + i.dish.priceCops * i.quantity,
    0
  );
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  async function sendOrder() {
    if (!joined || !sessionId || !dinerId || cart.length === 0) return;
    setSending(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        dinerId,
        items: cart.map((c) => ({
          dishId: c.dish.id,
          quantity: c.quantity,
        })),
      }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json();
      setToast(data.error || "Error al enviar");
      return;
    }
    setCart([]);
    setCartOpen(false);
    setToast("¡Pedido enviado a cocina!");
    setTimeout(() => setToast(""), 2500);
  }

  async function callStaff(type: "MESERO" | "CUENTA") {
    if (!sessionId) {
      setToast("Únete a la mesa primero");
      return;
    }
    setAlertBusy(true);
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, type }),
    });
    setAlertBusy(false);
    setToast(type === "MESERO" ? "Mesero notificado" : "Cuenta solicitada");
    setTimeout(() => setToast(""), 2000);
  }

  if (!joined) {
    return (
      <div
        className="flex min-h-screen flex-col"
        style={
          {
            "--brand": restaurant.primaryColor,
            "--accent": restaurant.accentColor,
          } as React.CSSProperties
        }
      >
        <div className="relative flex min-h-[55svh] flex-col justify-end overflow-hidden hero-mesh px-5 pb-10 pt-8 text-white">
          <div className="noise-overlay absolute inset-0" />
          <div className="relative z-10 animate-fade-up">
            <p className="text-sm font-medium uppercase tracking-widest text-white/70">
              {table.label}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold sm:text-5xl">
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p className="mt-3 max-w-md text-white/80">{restaurant.description}</p>
            )}
          </div>
        </div>
        <div className="mx-auto w-full max-w-md -mt-4 rounded-t-3xl bg-[var(--paper)] px-5 py-8 animate-fade-up">
          <h2 className="text-lg font-semibold">¿Cómo te llamas?</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Así etiquetamos tus platos en la cuenta compartida de la mesa.
          </p>
          <Input
            className="mt-4"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && join()}
            autoFocus
          />
          <Button className="mt-4 w-full" onClick={join} disabled={!name.trim()}>
            Ver la carta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-28"
      style={
        {
          "--brand": restaurant.primaryColor,
          "--accent": restaurant.accentColor,
        } as React.CSSProperties
      }
    >
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[var(--paper)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--brand)]">
              {restaurant.name}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {table.label} · Hola, {name}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Llamar mesero"
              disabled={alertBusy}
              onClick={() => callStaff("MESERO")}
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Pedir cuenta"
              disabled={alertBusy}
              onClick={() => callStaff("CUENTA")}
            >
              <Receipt className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-lg px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              className="pl-9"
              placeholder="Buscar platos…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-[var(--muted)]">
            No hay platos con ese nombre.
          </p>
        )}
        {filtered.map((cat) => (
          <section key={cat.id} className="mb-8">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
              {cat.name}
            </h2>
            <ul className="space-y-3">
              {cat.dishes.map((dish) => (
                <li key={dish.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(dish)}
                    className="flex w-full gap-3 rounded-2xl bg-[var(--surface)] p-3 text-left shadow-sm ring-1 ring-black/5 transition hover:ring-[var(--brand)]/30"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--brand-soft)]">
                      {dish.imageUrl ? (
                        <Image
                          src={dish.imageUrl}
                          alt={dish.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                          unoptimized
                        />
                      ) : null}
                      {dish.modelGlbUrl && (
                        <span className="absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          4D
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-snug">{dish.name}</h3>
                        {dish.soldOut && (
                          <Badge className="bg-black/10 text-[var(--muted)]">
                            Agotado
                          </Badge>
                        )}
                      </div>
                      {dish.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                          {dish.description}
                        </p>
                      )}
                      <p className="mt-2 font-semibold text-[var(--brand)]">
                        {formatCops(dish.priceCops)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Button
            variant="outline"
            className="relative flex-1"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            Mi pedido
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </Button>
          <Button asChild variant="secondary" className="flex-1">
            <Link href={`/r/${restaurant.slug}/m/${table.code}/cuenta`}>
              Ver cuenta
            </Link>
          </Button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[var(--surface)] p-5 animate-fade-up sm:rounded-3xl">
            <div className="mb-3 flex items-start justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {selected.name}
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setSelected(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {selected.modelGlbUrl ? (
              <div className="relative mb-4 h-64 w-full">
                <ModelViewer
                  glbUrl={selected.modelGlbUrl}
                  usdzUrl={selected.modelUsdzUrl}
                  poster={selected.imageUrl}
                  alt={selected.name}
                />
                <p className="mt-2 flex items-center gap-1 text-xs text-[var(--muted)]">
                  <Box className="h-3.5 w-3.5" /> Carta 4D — gira, zoom y AR
                </p>
              </div>
            ) : selected.imageUrl ? (
              <div className="relative mb-4 h-52 w-full overflow-hidden rounded-2xl">
                <Image
                  src={selected.imageUrl}
                  alt={selected.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            {selected.description && (
              <p className="text-sm text-[var(--muted)]">{selected.description}</p>
            )}
            <p className="mt-3 text-xl font-bold text-[var(--brand)]">
              {formatCops(selected.priceCops)}
            </p>
            <Button
              className="mt-5 w-full"
              disabled={selected.soldOut}
              onClick={() => {
                addToCart(selected);
                setSelected(null);
              }}
            >
              {selected.soldOut ? "Agotado" : "Agregar a mi pedido"}
            </Button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="max-h-[85svh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[var(--surface)] p-5 animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tu pedido</h2>
              <Button size="icon" variant="ghost" onClick={() => setCartOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {cart.length === 0 ? (
              <p className="py-8 text-center text-[var(--muted)]">
                Aún no has agregado platos.
              </p>
            ) : (
              <ul className="space-y-3">
                {cart.map((item) => (
                  <li
                    key={item.dish.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.dish.name}</p>
                      <p className="text-sm text-[var(--brand)]">
                        {formatCops(item.dish.priceCops * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setQty(item.dish.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setQty(item.dish.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-[var(--brand)]">
                {formatCops(cartTotal)}
              </span>
            </div>
            <Button
              className="mt-4 w-full"
              variant="accent"
              disabled={cart.length === 0 || sending}
              onClick={sendOrder}
            >
              {sending ? "Enviando…" : "Enviar a cocina"}
            </Button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-white shadow-lg animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
