export type SplitItem = {
  id: string;
  dinerId: string | null;
  dinerName: string;
  quantity: number;
  unitPrice: number;
};

export type SplitResult = {
  dinerId: string | null;
  dinerName: string;
  subtotal: number;
  tip: number;
  total: number;
  itemCount: number;
};

/** Calcula la cuenta por persona: por ítems etiquetados o en partes iguales. */
export function splitBill(
  items: SplitItem[],
  mode: "POR_ITEMS" | "IGUAL",
  tipPercent: number,
  dinerNames?: string[]
): SplitResult[] {
  if (items.length === 0) {
    const names = dinerNames?.length ? dinerNames : ["Mesa"];
    return names.map((name) => ({
      dinerId: null,
      dinerName: name,
      subtotal: 0,
      tip: 0,
      total: 0,
      itemCount: 0,
    }));
  }

  const grandSubtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tipTotal = Math.round((grandSubtotal * tipPercent) / 100);

  if (mode === "IGUAL") {
    const names =
      dinerNames && dinerNames.length > 0
        ? dinerNames
        : Array.from(new Set(items.map((i) => i.dinerName)));
    const n = Math.max(names.length, 1);
    const base = Math.floor(grandSubtotal / n);
    const tipEach = Math.floor(tipTotal / n);
    let rem = grandSubtotal - base * n;
    let tipRem = tipTotal - tipEach * n;

    return names.map((name) => {
      const extra = rem > 0 ? 1 : 0;
      const tipExtra = tipRem > 0 ? 1 : 0;
      if (rem > 0) rem -= 1;
      if (tipRem > 0) tipRem -= 1;
      const subtotal = base + extra;
      const tip = tipEach + tipExtra;
      return {
        dinerId: null,
        dinerName: name,
        subtotal,
        tip,
        total: subtotal + tip,
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
      };
    });
  }

  const byDiner = new Map<string, SplitResult>();
  for (const item of items) {
    const key = item.dinerId || item.dinerName || "Sin nombre";
    const existing = byDiner.get(key) || {
      dinerId: item.dinerId,
      dinerName: item.dinerName || "Sin nombre",
      subtotal: 0,
      tip: 0,
      total: 0,
      itemCount: 0,
    };
    existing.subtotal += item.unitPrice * item.quantity;
    existing.itemCount += item.quantity;
    byDiner.set(key, existing);
  }

  const results = Array.from(byDiner.values());
  for (const r of results) {
    r.tip =
      grandSubtotal > 0
        ? Math.round((r.subtotal / grandSubtotal) * tipTotal)
        : 0;
    r.total = r.subtotal + r.tip;
  }

  // Ajuste residual de propina al primero
  const tipSum = results.reduce((s, r) => s + r.tip, 0);
  if (results.length && tipSum !== tipTotal) {
    results[0].tip += tipTotal - tipSum;
    results[0].total = results[0].subtotal + results[0].tip;
  }

  return results;
}
