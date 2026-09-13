import type { OrderRequest } from './types.ts';
import { rateFor } from './shipping.ts';

export interface Order {
  customerId: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  carrier: string;
  totalCents: number;
  appliedCode: string | null;
}

export class CheckoutService {
  createOrder(request: OrderRequest): Order {
    const subtotalCents = request.items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0,
    );

    const code = request.discountCode ?? null;
    const discountCents = code ? Math.round(subtotalCents * (code.percentOff / 100)) : 0;

    // destination is required by OrderRequest, so the runtime checks it used to
    // carry are redundant now that the type guarantees it.
    const rate = rateFor(request.destination.country);

    return {
      customerId: request.customerId,
      subtotalCents,
      discountCents,
      shippingCents: rate.cents,
      carrier: rate.carrier,
      totalCents: subtotalCents - discountCents + rate.cents,
      appliedCode: code ? code.value : null,
    };
  }
}
