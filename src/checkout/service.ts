import type { OrderRequest } from './types.ts';
import { rateFor } from './shipping.ts';
import { CheckoutValidationError } from './errors.ts';
import { supportedCountries } from './shipping.ts';
import { giftWrapPrice, supportedGiftWrapStyles } from './gift-wrap.ts';

export interface Order {
  customerId: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  giftWrapCents: number;
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

    // Same shape of problem as the shipping rate above: only the styles in
    // GIFT_WRAP_PRICES are priced, and the style arrives as unvalidated JSON, so
    // the lookup can miss. Reject the request instead of dereferencing undefined.
    let giftWrapCents = 0;
    const giftWrap = request.giftWrap;
    if (giftWrap) {
      const wrapPrice = giftWrapPrice(giftWrap.style);
      if (!wrapPrice) {
        throw new CheckoutValidationError(
          'unsupported_gift_wrap_style',
          `No gift wrap is available for style '${String(giftWrap.style)}'. ` +
            `Supported styles: ${supportedGiftWrapStyles().join(', ')}.`,
        );
      }
      giftWrapCents = wrapPrice.cents;
    }

    return {
      customerId: request.customerId,
      subtotalCents,
      discountCents,
      shippingCents: rate.cents,
      giftWrapCents,
      carrier: rate.carrier,
      totalCents: subtotalCents - discountCents + rate.cents + giftWrapCents,
      appliedCode: code ? code.value : null,
    };
  }
}
