import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CheckoutService } from '../src/checkout/service.ts';

/**
 * Regression coverage for the no-discount-code path (the test deleted by the
 * revert that is currently deployed).
 *
 * `OrderRequest.discountCode` is declared optional (`DiscountCode | null`), but
 * `CheckoutService.createOrder` dereferences it unconditionally, so any order
 * submitted without a discount code throws
 * `TypeError: Cannot read properties of undefined (reading 'percentOff')`
 * at src/checkout/service.ts:22 — exactly the production cluster on /orders.
 */
describe('CheckoutService without a discount code', () => {
  const service = new CheckoutService();

  it('charges the full subtotal when discountCode is omitted', () => {
    const order = service.createOrder({
      customerId: 'cus_3',
      items: [{ sku: 'A', quantity: 2, unitPriceCents: 1000 }],
    });

    assert.equal(order.customerId, 'cus_3');
    assert.equal(order.subtotalCents, 2000);
    assert.equal(order.discountCents, 0);
    assert.equal(order.totalCents, 2000);
    assert.equal(order.appliedCode, null);
  });

  it('charges the full subtotal when discountCode is explicitly null', () => {
    const order = service.createOrder({
      customerId: 'cus_4',
      items: [
        { sku: 'A', quantity: 1, unitPriceCents: 500 },
        { sku: 'B', quantity: 3, unitPriceCents: 250 },
      ],
      discountCode: null,
    });

    assert.equal(order.subtotalCents, 1250);
    assert.equal(order.discountCents, 0);
    assert.equal(order.totalCents, 1250);
    assert.equal(order.appliedCode, null);
  });

  it('still applies a discount when a code is supplied', () => {
    const order = service.createOrder({
      customerId: 'cus_5',
      items: [{ sku: 'A', quantity: 2, unitPriceCents: 1000 }],
      discountCode: { value: 'SAVE10', percentOff: 10 },
    });

    assert.equal(order.subtotalCents, 2000);
    assert.equal(order.discountCents, 200);
    assert.equal(order.totalCents, 1800);
    assert.equal(order.appliedCode, 'SAVE10');
  });
});
