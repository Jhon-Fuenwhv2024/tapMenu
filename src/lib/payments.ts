import type { PaymentMethod } from "@prisma/client";
export { PAYMENT_METHOD_LABELS } from "./payment-labels";

/**
 * Abstracción de proveedor de pagos.
 * MVP: confirmación manual por el personal (Nequi/Daviplata/efectivo/tarjeta).
 * Futuro: implementar WompiPaymentProvider sin cambiar el resto de la app.
 */
export interface PaymentIntent {
  amountCops: number;
  tipCops: number;
  method: PaymentMethod;
  dinerName?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  provider: string;
  status: "PENDIENTE" | "CONFIRMADO" | "RECHAZADO";
  providerRef: string;
  checkoutUrl?: string;
  message: string;
}

export interface PaymentProvider {
  readonly name: string;
  createIntent(intent: PaymentIntent): Promise<PaymentResult>;
  confirm(providerRef: string): Promise<PaymentResult>;
}

/** Proveedor manual: el mesero confirma el pago en el panel. */
export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual";

  async createIntent(intent: PaymentIntent): Promise<PaymentResult> {
    const ref = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      provider: this.name,
      status: "PENDIENTE",
      providerRef: ref,
      message: `Pago ${intent.method} pendiente de confirmación del personal`,
    };
  }

  async confirm(providerRef: string): Promise<PaymentResult> {
    return {
      provider: this.name,
      status: "CONFIRMADO",
      providerRef,
      message: "Pago confirmado por el personal",
    };
  }
}

/** Placeholder para integración futura con Wompi. */
export class WompiPaymentProvider implements PaymentProvider {
  readonly name = "wompi";

  async createIntent(intent: PaymentIntent): Promise<PaymentResult> {
    void intent;
    throw new Error(
      "WompiPaymentProvider aún no está configurado. Usa ManualPaymentProvider o configura WOMPI_PRIVATE_KEY."
    );
  }

  async confirm(providerRef: string): Promise<PaymentResult> {
    void providerRef;
    throw new Error("WompiPaymentProvider aún no está configurado.");
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.WOMPI_PRIVATE_KEY) {
    return new WompiPaymentProvider();
  }
  return new ManualPaymentProvider();
}
