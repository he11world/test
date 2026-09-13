import type { DiscountCode, OrderRequest } from './types.ts';

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
    // narrowed before it is dereferenced. An order submitted without a code is a
    // valid order with no discount applied.
    const code: DiscountCode | null = request.discountCode ?? null;
    const discountCents = code === null
      ? 0
      : Math.round(subtotalCents * (code.percentOff / 100));

    return {
      customerId: request.customerId,
      subtotalCents,
      discountCents,
      totalCents: subtotalCents - discountCents,
      appliedCode: code === null ? null : code.value,
    };
  }
}
