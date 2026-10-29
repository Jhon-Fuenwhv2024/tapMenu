export const PAYMENT_METHOD_LABELS = {
  NEQUI: "Nequi",
  DAVIPLATA: "Daviplata",
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHOD_LABELS;
