import type { OrderRequest } from './types.ts';

export interface Order {
  customerId: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  appliedCode: string | null;
}

export class CheckoutService {
  createOrder(request: OrderRequest): Order {
    const subtotalCents = request.items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0,
    );

    // discountCode is optional (`DiscountCode | null | undefined`): an order may be
    // submitted without one. Treat an absent code as a zero discount rather than
    // dereferencing it unconditionally.
    const code = request.discountCode ?? null;
    const discountCents =
      code === null ? 0 : Math.round(subtotalCents * (code.percentOff / 100));

    return {
      customerId: request.customerId,
      subtotalCents,
      discountCents,
      totalCents: subtotalCents - discountCents,
      appliedCode: code === null ? null : code.value,
    };
  }
}
