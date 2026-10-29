import { describe, expect, it } from "vitest";

/** Lógica pura de totales de pedido (espejo de lo que usa la API). */
function orderTotal(
  items: { quantity: number; unitPrice: number }[]
): number {
  return items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
}

function validateOrderItems(
  items: { dishId: string; quantity: number }[],
  available: { id: string; soldOut: boolean; priceCops: number }[]
): { ok: true; lines: { dishId: string; quantity: number; unitPrice: number }[] } | { ok: false; error: string } {
  if (items.length === 0) return { ok: false, error: "Pedido vacío" };
  const byId = Object.fromEntries(available.map((d) => [d.id, d]));
  const lines = [];
  for (const i of items) {
    const d = byId[i.dishId];
    if (!d || d.soldOut) return { ok: false, error: "Plato no disponible" };
    if (i.quantity < 1 || i.quantity > 20) return { ok: false, error: "Cantidad inválida" };
    lines.push({ dishId: i.dishId, quantity: i.quantity, unitPrice: d.priceCops });
  }
  return { ok: true, lines };
}

describe("ordering", () => {
  const menu = [
    { id: "mojarra", soldOut: false, priceCops: 32000 },
    { id: "churrasco", soldOut: true, priceCops: 35000 },
    { id: "limonada", soldOut: false, priceCops: 8000 },
  ];

  it("calcula el total del pedido", () => {
    expect(
      orderTotal([
        { quantity: 2, unitPrice: 8000 },
        { quantity: 1, unitPrice: 32000 },
      ])
    ).toBe(48000);
  });

  it("rechaza platos agotados", () => {
    const res = validateOrderItems(
      [{ dishId: "churrasco", quantity: 1 }],
      menu
    );
    expect(res.ok).toBe(false);
  });

  it("arma líneas con precio congelado al pedir", () => {
    const res = validateOrderItems(
      [
        { dishId: "mojarra", quantity: 1 },
        { dishId: "limonada", quantity: 2 },
      ],
      menu
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(orderTotal(res.lines)).toBe(48000);
    }
  });
});
