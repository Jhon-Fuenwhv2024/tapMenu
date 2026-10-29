"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TapMenuLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCops } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";

type Order = {
  id: string;
  status: string;
  createdAt: string;
  note: string | null;
  session: { table: { label: string } };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    note: string | null;
    dish: { name: string };
    diner: { name: string } | null;
  }[];
};

type Alert = {
  id: string;
  type: string;
  message: string | null;
  session: { table: { label: string } };
};

const STATUS_FLOW = ["RECIBIDO", "EN_PREPARACION", "LISTO", "ENTREGADO"] as const;
const STATUS_LABEL: Record<string, string> = {
  RECIBIDO: "Recibido",
  EN_PREPARACION: "En preparación",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
};

export function KdsBoard({
  restaurantId,
  restaurantName,
}: {
  restaurantId: string;
  restaurantName: string;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const audioCtx = useRef<AudioContext | null>(null);

  const beep = useCallback(() => {
    if (!soundOn) return;
    try {
      const ctx =
        audioCtx.current ||
        new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      audioCtx.current = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.08;
      o.start();
      o.stop(ctx.currentTime + 0.18);
    } catch {
      /* ignore */
    }
  }, [soundOn]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/kds/${restaurantId}`);
    if (!res.ok) return;
    const data = await res.json();
    setOrders(data.orders);
    setAlerts(data.alerts);
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(restaurantId, (ev) => {
    if (
      ev.type === "order.created" ||
      ev.type === "order.updated" ||
      ev.type === "alert.created" ||
      ev.type === "alert.updated"
    ) {
      if (ev.type === "order.created" || ev.type === "alert.created") beep();
      load();
    }
  });

  async function nextStatus(order: Order) {
    const idx = STATUS_FLOW.indexOf(
      order.status as (typeof STATUS_FLOW)[number]
    );
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const status = STATUS_FLOW[idx + 1];
    await fetch(`/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function dismissAlert(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "PATCH" });
    await load();
  }

  const columns = ["RECIBIDO", "EN_PREPARACION", "LISTO"] as const;

  return (
    <div className="min-h-screen bg-[var(--ink)] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <TapMenuLogo className="text-white [&_span]:text-[#ffb347]" size="sm" />
          <p className="text-sm text-white/60">
            Cocina · {restaurantName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={soundOn ? "accent" : "outline"}
            className={!soundOn ? "border-white/30 text-white" : ""}
            onClick={() => setSoundOn((s) => !s)}
          >
            Sonido {soundOn ? "ON" : "OFF"}
          </Button>
          <Button asChild size="sm" variant="ghost" className="text-white">
            <Link href="/admin">Admin</Link>
          </Button>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="space-y-2 border-b border-white/10 bg-[var(--accent)]/20 px-4 py-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 animate-pulse-soft"
            >
              <p className="text-sm font-semibold">
                {a.type === "MESERO" ? "🔔 Mesero" : "🧾 Cuenta"} —{" "}
                {a.session.table.label}
                {a.message ? `: ${a.message}` : ""}
              </p>
              <Button size="sm" variant="secondary" onClick={() => dismissAlert(a.id)}>
                Atendida
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 p-3 md:grid-cols-3">
        {columns.map((col) => (
          <section key={col} className="min-h-[40vh] rounded-2xl bg-white/5 p-3">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/70">
              {STATUS_LABEL[col]}
            </h2>
            <div className="space-y-3">
              {orders
                .filter((o) => o.status === col)
                .map((order) => (
                  <article
                    key={order.id}
                    className="rounded-xl bg-[var(--surface)] p-3 text-[var(--ink)] shadow animate-slide-in"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Badge className="bg-[var(--brand)] text-white">
                        {order.session.table.label}
                      </Badge>
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(order.createdAt).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {order.items.map((i) => (
                        <li key={i.id}>
                          <span className="font-semibold">{i.quantity}×</span>{" "}
                          {i.dish.name}
                          {i.diner && (
                            <span className="text-[var(--muted)]">
                              {" "}
                              · {i.diner.name}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs font-medium text-[var(--brand)]">
                      {formatCops(
                        order.items.reduce(
                          (s, i) => s + i.unitPrice * i.quantity,
                          0
                        )
                      )}
                    </p>
                    <Button
                      className="mt-3 w-full"
                      size="sm"
                      variant="accent"
                      onClick={() => nextStatus(order)}
                    >
                      → {STATUS_LABEL[STATUS_FLOW[STATUS_FLOW.indexOf(col as typeof STATUS_FLOW[number]) + 1]]}
                    </Button>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
