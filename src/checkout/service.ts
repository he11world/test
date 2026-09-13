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

    // `discountCode` is optional (`DiscountCode | null | undefined`) since PR #377:
    // checkout may be submitted without a discount code. Guard the dereference so
    // an omitted or null code means "no discount" instead of a TypeError.
    const code: DiscountCode | null = request.discountCode ?? null;
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
