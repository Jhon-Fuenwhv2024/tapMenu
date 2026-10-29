import { describe, expect, it } from "vitest";
import { splitBill } from "./bill-split";

describe("splitBill", () => {
  const items = [
    {
      id: "1",
      dinerId: "a",
      dinerName: "Ana",
      quantity: 2,
      unitPrice: 10000,
    },
    {
      id: "2",
      dinerId: "b",
      dinerName: "Luis",
      quantity: 1,
      unitPrice: 15000,
    },
    {
      id: "3",
      dinerId: "a",
      dinerName: "Ana",
      quantity: 1,
      unitPrice: 5000,
    },
  ];

  it("divide por ítems etiquetados y reparte propina proporcional", () => {
    const shares = splitBill(items, "POR_ITEMS", 10);
    expect(shares).toHaveLength(2);

    const ana = shares.find((s) => s.dinerName === "Ana")!;
    const luis = shares.find((s) => s.dinerName === "Luis")!;

    expect(ana.subtotal).toBe(25000); // 2*10000 + 5000
    expect(luis.subtotal).toBe(15000);
    expect(ana.tip + luis.tip).toBe(4000); // 10% de 40000
    expect(ana.total + luis.total).toBe(44000);
  });

  it("divide en partes iguales entre comensales", () => {
    const shares = splitBill(items, "IGUAL", 0, ["Ana", "Luis"]);
    expect(shares).toHaveLength(2);
    expect(shares[0].subtotal + shares[1].subtotal).toBe(40000);
    expect(Math.abs(shares[0].subtotal - shares[1].subtotal)).toBeLessThanOrEqual(1);
  });

  it("devuelve ceros si no hay ítems", () => {
    const shares = splitBill([], "POR_ITEMS", 10, ["Solo"]);
    expect(shares[0].total).toBe(0);
  });
});
