"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCops } from "@/lib/utils";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethodKey,
} from "@/lib/payment-labels";

type BillData = {
  session: {
    id: string;
    tipPercent: number;
    splitMode: "POR_ITEMS" | "IGUAL";
    open: boolean;
  };
  items: {
    id: string;
    dinerName: string;
    quantity: number;
    unitPrice: number;
    dishName: string;
  }[];
  shares: {
    dinerName: string;
    subtotal: number;
    tip: number;
    total: number;
  }[];
  subtotal: number;
  tip: number;
  total: number;
  paymentMethods: { value: string; label: string }[];
};

export default function CuentaPage() {
  const params = useParams<{ slug: string; tableCode: string }>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingAs, setPayingAs] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethodKey>("NEQUI");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/tables/${params.slug}/${params.tableCode}/session`)
      .then((r) => r.json())
      .then((d) => {
        if (d.session?.id) setSessionId(d.session.id);
        else setError("No hay sesión activa");
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  }, [params.slug, params.tableCode]);

  const loadBill = useCallback(async () => {
    if (!sessionId) return;
    const res = await fetch(`/api/bill/${sessionId}`);
    if (!res.ok) {
      setError("No se pudo cargar la cuenta");
      return;
    }
    setBill(await res.json());
  }, [sessionId]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  async function updateOpts(patch: {
    tipPercent?: number;
    splitMode?: "POR_ITEMS" | "IGUAL";
  }) {
    if (!sessionId) return;
    await fetch(`/api/bill/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await loadBill();
  }

  async function pay(share: { dinerName: string; total: number; tip: number }) {
    if (!sessionId) return;
    setPayingAs(share.dinerName);
    const res = await fetch(`/api/bill/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        dinerName: share.dinerName,
        amountCops: share.total - share.tip,
        tipCops: share.tip,
      }),
    });
    setPayingAs(null);
    if (!res.ok) {
      setMsg("Error al registrar el pago");
      return;
    }
    setMsg(
      `Pago con ${PAYMENT_METHOD_LABELS[method]} registrado. El personal confirmará.`
    );
    await loadBill();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Cargando cuenta…
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="mx-auto max-w-lg px-5 py-12">
        <p className="text-red-600">{error || "Sin datos"}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={`/r/${params.slug}/m/${params.tableCode}`}>Volver al menú</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pb-16 pt-4">
      <Link
        href={`/r/${params.slug}/m/${params.tableCode}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--brand)]"
      >
        <ArrowLeft className="h-4 w-4" /> Menú
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--brand)]">
        Cuenta de la mesa
      </h1>

      <div className="mt-6 space-y-2">
        {bill.items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm">
            <span>
              {i.quantity}× {i.dishName}{" "}
              <span className="text-[var(--muted)]">({i.dinerName})</span>
            </span>
            <span className="font-medium">
              {formatCops(i.unitPrice * i.quantity)}
            </span>
          </div>
        ))}
        {bill.items.length === 0 && (
          <p className="text-[var(--muted)]">Aún no hay pedidos en esta mesa.</p>
        )}
      </div>

      <div className="mt-8 space-y-4 rounded-2xl bg-[var(--surface)] p-4 ring-1 ring-black/5">
        <div>
          <p className="text-sm font-medium">Dividir</p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant={bill.session.splitMode === "POR_ITEMS" ? "default" : "outline"}
              onClick={() => updateOpts({ splitMode: "POR_ITEMS" })}
            >
              Por ítems
            </Button>
            <Button
              size="sm"
              variant={bill.session.splitMode === "IGUAL" ? "default" : "outline"}
              onClick={() => updateOpts({ splitMode: "IGUAL" })}
            >
              Partes iguales
            </Button>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Propina ({bill.session.tipPercent}%)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[0, 5, 10, 15].map((p) => (
              <Button
                key={p}
                size="sm"
                variant={bill.session.tipPercent === p ? "accent" : "outline"}
                onClick={() => updateOpts({ tipPercent: p })}
              >
                {p}%
              </Button>
            ))}
          </div>
        </div>
        <div className="border-t border-black/5 pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCops(bill.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Propina</span>
            <span>{formatCops(bill.tip)}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-[var(--brand)]">{formatCops(bill.total)}</span>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Tu parte</h2>
      <div className="mt-3 space-y-3">
        {bill.shares.map((s) => (
          <div
            key={s.dinerName}
            className="rounded-2xl bg-[var(--surface)] p-4 ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{s.dinerName}</p>
              <p className="text-lg font-bold text-[var(--brand)]">
                {formatCops(s.total)}
              </p>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Incluye propina {formatCops(s.tip)}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Método de pago</h2>
      <p className="text-xs text-[var(--muted)]">
        Confirmación manual por el personal (MVP). Listo para Wompi después.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethodKey[]).map((m) => (
          <Button
            key={m}
            variant={method === m ? "default" : "outline"}
            onClick={() => setMethod(m)}
          >
            {PAYMENT_METHOD_LABELS[m]}
          </Button>
        ))}
      </div>

      {bill.shares[0] && (
        <Button
          className="mt-6 w-full"
          variant="accent"
          disabled={!!payingAs || bill.total === 0}
          onClick={() => pay(bill.shares[0])}
        >
          {payingAs
            ? "Registrando…"
            : `Pagar mi parte (${PAYMENT_METHOD_LABELS[method]})`}
        </Button>
      )}

      {msg && (
        <p className="mt-4 rounded-xl bg-[var(--brand-soft)] p-3 text-sm text-[var(--brand)]">
          {msg}
        </p>
      )}
    </div>
  );
}
