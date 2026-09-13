import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CheckoutService } from '../src/checkout/service.ts';
import type { Order } from '../src/checkout/service.ts';
import { rateFor } from '../src/checkout/shipping.ts';

interface Attempt {
  order: Order | null;
  error: Error | null;
}

const attempt = (run: () => Order): Attempt => {
  try {
    return { order: run(), error: null };
  } catch (thrown) {
    return { order: null, error: thrown instanceof Error ? thrown : new Error(String(thrown)) };
  }
};

/**
 * A request the service cannot price must be handled explicitly: either it is
 * rejected with a deliberate (non-TypeError) validation error the HTTP layer can
 * map to a 400, or it is priced with an explicit fallback. What it must never do
 * is dereference undefined and surface a raw TypeError as a 500.
 */
const assertHandled = (result: Attempt, label: string) => {
  const error = result.error;
  if (error) {
    assert.ok(
      !(error instanceof TypeError),
      `${label}: createOrder threw an unhandled TypeError: ${error.message}`,
    );
    assert.ok(
      !error.message.includes('Cannot read properties of undefined'),
      `${label}: createOrder dereferenced undefined: ${error.message}`,
    );
    return;
  }

  const order = result.order;
  assert.ok(order, `${label}: createOrder returned nothing and threw nothing`);
  assert.equal(typeof order.shippingCents, 'number', `${label}: shippingCents must be a number`);
  assert.ok(
    Number.isFinite(order.shippingCents),
    `${label}: shippingCents must be finite, got ${String(order.shippingCents)}`,
  );
  assert.equal(typeof order.carrier, 'string', `${label}: carrier must be a string`);
  assert.ok(
    Number.isFinite(order.totalCents),
    `${label}: totalCents must be finite, got ${String(order.totalCents)}`,
  );
};

describe('CheckoutService bad-input handling', () => {
  const service = new CheckoutService();

  it('handles an order with no destination instead of throwing a TypeError', () => {
    const result = attempt(() =>
      service.createOrder({
        customerId: 'cus_x',
        items: [{ sku: 'A', quantity: 1, unitPriceCents: 1000 }],
      }),
    );
    assertHandled(result, 'missing destination');
  });

  it('handles an unsupported shipping country instead of throwing a TypeError', () => {
    const result = attempt(() =>
      service.createOrder({
        customerId: 'cus_y',
        items: [{ sku: 'A', quantity: 1, unitPriceCents: 1000 }],
        destination: { country: 'ZZ', postcode: '00000' },
      }),
    );
    assertHandled(result, 'unsupported country ZZ');
  });

  it('returns a well-formed rate or nothing at all for an unknown country', () => {
    const rate = rateFor('ZZ');
    if (rate !== undefined) {
      assert.equal(typeof rate.cents, 'number');
      assert.equal(typeof rate.carrier, 'string');
      assert.ok(Number.isFinite(rate.cents));
    }
  });

  it('keeps the supported-country pricing unchanged', () => {
    const gb = service.createOrder({
      customerId: 'cus_1',
      items: [{ sku: 'A', quantity: 2, unitPriceCents: 1000 }],
      discountCode: { value: 'SAVE10', percentOff: 10 },
      destination: { country: 'GB', postcode: 'EC1A 1BB' },
    });
    assert.equal(gb.totalCents, 2299);
    assert.equal(gb.shippingCents, 499);

    const us = service.createOrder({
      customerId: 'cus_3',
      items: [{ sku: 'A', quantity: 1, unitPriceCents: 500 }],
      destination: { country: 'US', postcode: '10001' },
    });
    assert.equal(us.totalCents, 1299);
    assert.equal(us.carrier, 'usps');
  });
});
