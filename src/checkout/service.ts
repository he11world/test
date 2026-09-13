import type { OrderRequest } from './types.ts';
import { rateFor } from './shipping.ts';
import { CheckoutValidationError } from './errors.ts';
import { supportedCountries } from './shipping.ts';

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

    // The wire format is unvalidated JSON cast to OrderRequest by the HTTP layer,
    // so the static type carries no runtime force: `destination` can be absent.
    // Refuse it explicitly instead of dereferencing undefined.
    const destination = request.destination;
    if (!destination || typeof destination.country !== 'string' || destination.country === '') {
      throw new CheckoutValidationError(
        'missing_destination',
        'A shipping destination with a country is required to price an order.',
      );
    }

    // Only the countries in SHIPPING_RATES are priced, so the lookup can miss.
    const rate = rateFor(destination.country);
    if (!rate) {
      throw new CheckoutValidationError(
        'unsupported_shipping_country',
        `No shipping rate is available for country '${destination.country}'. ` +
          `Supported countries: ${supportedCountries().join(', ')}.`,
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
