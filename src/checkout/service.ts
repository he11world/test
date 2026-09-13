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

    // `OrderRequest.discountCode` is optional and nullable: a checkout submitted
    // without a discount code is a legitimate input. Dereferencing it
    // unconditionally threw `TypeError: Cannot read properties of undefined
    // (reading 'percentOff')` for every codeless order, which the HTTP layer
    // turned into a 500 `checkout_failed`. Normalise the absent case to null and
    // only price a discount when a code is actually present.
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
