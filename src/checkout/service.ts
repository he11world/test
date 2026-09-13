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

    // `OrderRequest.discountCode` is optional/nullable: checkout may be submitted
    // without a code. Absent code means no discount rather than an error.
    const code = request.discountCode ?? null;
    const discountCents = code
      ? Math.round(subtotalCents * (code.percentOff / 100))
      : 0;

    return {
      customerId: request.customerId,
      subtotalCents,
      discountCents,
      totalCents: subtotalCents - discountCents,
      appliedCode: code ? code.value : null,
    };
  }
}
