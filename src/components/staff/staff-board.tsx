"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TapMenuLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { formatCops } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-labels";

type Alert = {
  id: string;
  type: string;
  message: string | null;
  createdAt: string;
  session: { id: string; table: { label: string } };
};

type Payment = {
  id: string;
  dinerName: string | null;
  method: keyof typeof PAYMENT_METHOD_LABELS;
  amountCops: number;
  tipCops: number;
  status: string;
  sessionId: string;
};

export function StaffBoard({
  restaurantId,
  restaurantName,
}: {
  restaurantId: string;
  restaurantName: string;
}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [ordersReady, setOrdersReady] = useState<
    { id: string; table: string; items: string }[]
  >([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/kds/${restaurantId}`);
    if (!res.ok) return;
    const data = await res.json();
    setAlerts(data.alerts);
    setOrdersReady(
      data.orders
        .filter((o: { status: string }) => o.status === "LISTO")
        .map(
          (o: {
            id: string;
            session: { table: { label: string } };
            items: { quantity: number; dish: { name: string } }[];
          }) => ({
            id: o.id,
            table: o.session.table.label,
            items: o.items
              .map((i) => `${i.quantity}× ${i.dish.name}`)
              .join(", "),
          })
        )
    );

    const payRes = await fetch(`/api/staff/payments?restaurantId=${restaurantId}`);
    if (payRes.ok) {
      setPayments(await payRes.json());
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(restaurantId, (ev) => {
    if (
      ev.type.startsWith("order") ||
      ev.type.startsWith("alert") ||
      ev.type.startsWith("payment")
    ) {
      load();
    }
  });

  async function dismiss(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "PATCH" });
    load();
  }

  async function deliver(orderId: string) {
    await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ENTREGADO" }),
    });
    load();
  }

  async function confirmPay(id: string) {
    await fetch(`/api/payments/${id}/confirm`, { method: "POST" });
    load();
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-black/5 bg-[var(--surface)] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <TapMenuLogo size="sm" />
            <p className="text-sm text-[var(--muted)]">
              Meseros · {restaurantName}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin">Admin</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        <section>
          <h2 className="text-lg font-bold">Alertas de mesa</h2>
          {alerts.length === 0 && (
            <p className="mt-2 text-sm text-[var(--muted)]">Sin alertas pendientes.</p>
          )}
          <ul className="mt-3 space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-xl bg-[var(--accent-soft)] px-4 py-3 animate-pulse-soft"
              >
                <div>
                  <p className="font-semibold">
                    {a.type === "MESERO" ? "Llaman mesero" : "Piden la cuenta"} —{" "}
                    {a.session.table.label}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(a.createdAt).toLocaleTimeString("es-CO")}
                  </p>
                </div>
                <Button size="sm" onClick={() => dismiss(a.id)}>
                  Atendida
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold">Listos para entregar</h2>
          <ul className="mt-3 space-y-2">
            {ordersReady.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3 ring-1 ring-black/5"
              >
                <div>
                  <p className="font-semibold">{o.table}</p>
                  <p className="text-sm text-[var(--muted)]">{o.items}</p>
                </div>
                <Button size="sm" variant="accent" onClick={() => deliver(o.id)}>
                  Entregado
                </Button>
              </li>
            ))}
            {ordersReady.length === 0 && (
              <p className="text-sm text-[var(--muted)]">Nada listo por ahora.</p>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold">Pagos por confirmar</h2>
          <ul className="mt-3 space-y-2">
            {payments
              .filter((p) => p.status === "PENDIENTE")
              .map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3 ring-1 ring-black/5"
                >
                  <div>
                    <p className="font-semibold">
                      {p.dinerName || "Cliente"} · {PAYMENT_METHOD_LABELS[p.method]}
                    </p>
                    <p className="text-sm text-[var(--brand)]">
                      {formatCops(p.amountCops + p.tipCops)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => confirmPay(p.id)}>
                    Confirmar
                  </Button>
                </li>
              ))}
            {payments.filter((p) => p.status === "PENDIENTE").length === 0 && (
              <p className="text-sm text-[var(--muted)]">Sin pagos pendientes.</p>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
