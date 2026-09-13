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

    // `OrderRequest.discountCode` is optional and nullable (widened in PR #377):
    // checkout may be submitted without a discount code. Guard the dereference so
    // a codeless order is priced at the full subtotal instead of throwing.
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
