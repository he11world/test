import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CheckoutService } from '../src/checkout/service.ts';
import { CheckoutValidationError } from '../src/checkout/errors.ts';
import type { GiftWrapStyle } from '../src/checkout/types.ts';

describe('CheckoutService gift wrap with an unpriced style', () => {
  const service = new CheckoutService();
  const destination = { country: 'GB', postcode: 'EC1A 1BB' };
  const items = [{ sku: 'A', quantity: 1, unitPriceCents: 1000 }];

  it("rejects the 'premium' style as a typed validation error, not a TypeError", () => {
    let thrown: unknown;
    try {
      service.createOrder({
        customerId: 'cus_9',
        items,
        destination,
        giftWrap: { style: 'premium' },
      });
    } catch (error) {
      thrown = error;
    }

    assert.ok(
      thrown instanceof CheckoutValidationError,
      `expected a CheckoutValidationError for an unpriced gift-wrap style, got: ${
        thrown instanceof Error ? `${thrown.name}: ${thrown.message}` : String(thrown)
      }`,
    );
    assert.equal((thrown as CheckoutValidationError).code, 'unsupported_gift_wrap_style');
    assert.match((thrown as CheckoutValidationError).message, /standard/);
  });

  it('rejects a gift-wrap style that is not in the type union at all', () => {
    let thrown: unknown;
    try {
      service.createOrder({
        customerId: 'cus_10',
        items,
        destination,
        // The HTTP layer casts unvalidated JSON to OrderRequest, so arbitrary
        // strings reach the service at runtime.
        giftWrap: { style: 'gold-foil' as GiftWrapStyle },
      });
    } catch (error) {
      thrown = error;
    }

    assert.ok(
      thrown instanceof CheckoutValidationError,
      `expected a CheckoutValidationError for an unrecognised gift-wrap style, got: ${
        thrown instanceof Error ? `${thrown.name}: ${thrown.message}` : String(thrown)
      }`,
    );
    assert.equal((thrown as CheckoutValidationError).code, 'unsupported_gift_wrap_style');
  });

  it("still prices the 'standard' style", () => {
    const order = service.createOrder({
      customerId: 'cus_11',
      items,
      destination,
      giftWrap: { style: 'standard' },
    });
    assert.equal(order.giftWrapCents, 299);
    assert.equal(order.totalCents, 1000 + 499 + 299);
  });

  it('still prices an order with no gift wrap', () => {
    const order = service.createOrder({
      customerId: 'cus_12',
      items,
      destination,
    });
    assert.equal(order.giftWrapCents, 0);
    assert.equal(order.totalCents, 1499);
  });
});
