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

    // `discountCode` is optional and nullable on OrderRequest, so it must be
    // treated as absent rather than dereferenced unconditionally. An order with
    // no discount code is a full-price order: zero discount, null applied code
    // (which is why `Order.appliedCode` is typed `string | null`).
    const code = request.discountCode;
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
