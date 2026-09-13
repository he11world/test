import type { OrderRequest } from './types.ts';
import { rateFor, supportedCountries } from './shipping.ts';
import { CheckoutValidationError } from './errors.ts';

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

    // `destination` is optional on the wire, so it has to be checked here rather
    // than assumed. Without it there is no country to price shipping against.
    const destination = request.destination;
    if (!destination || typeof destination.country !== 'string' || destination.country === '') {
      throw new CheckoutValidationError(
        'missing_destination',
        'A shipping destination with a country is required to price an order.',
      );
    }

    // The rate lookup can miss: only the negotiated countries are priced.
    const rate = rateFor(destination.country);
    if (!rate) {
      throw new CheckoutValidationError(
        'unsupported_shipping_country',
        `Shipping is not available to ${destination.country}. Supported countries: ${supportedCountries().join(', ')}.`,
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
