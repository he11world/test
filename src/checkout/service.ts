import type { OrderRequest, ShippingDestination } from './types.ts';
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

/**
 * A deliberate rejection of a client-supplied order. The HTTP layer turns this
 * into a 4xx; it must never surface as an unhandled TypeError / 500.
 */
export class InvalidOrderError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'InvalidOrderError';
    this.code = code;
  }
}

function requireDestination(destination: ShippingDestination | undefined): ShippingDestination {
  if (
    !destination ||
    typeof destination !== 'object' ||
    typeof destination.country !== 'string' ||
    destination.country.length === 0
  ) {
    throw new InvalidOrderError(
      'invalid_order',
      'order requires a destination with a country',
    );
  }
  return destination;
}

export class CheckoutService {
  createOrder(request: OrderRequest): Order {
    const subtotalCents = request.items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0,
    );

    const code = request.discountCode ?? null;
    const discountCents = code ? Math.round(subtotalCents * (code.percentOff / 100)) : 0;

    const destination = requireDestination(request.destination);
    const rate = rateFor(destination.country);
    if (!rate) {
      throw new InvalidOrderError(
        'unsupported_destination',
        `no shipping rate configured for country ${destination.country}`,
      );
    }

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
