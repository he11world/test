import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CheckoutService } from '../src/checkout/service.ts';

/**
 * Regression coverage for the production /orders 500s.
 *
 * OrderRequest.discountCode is optional (`discountCode?: DiscountCode | null`),
 * but CheckoutService.createOrder dereferences it unconditionally. Any order
 * submitted without a discount code therefore throws
 * `TypeError: Cannot read properties of undefined (reading 'percentOff')`.
 */
describe('CheckoutService without a discount code', () => {
  const service = new CheckoutService();

  it('prices an order when discountCode is omitted', () => {
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

  it('prices an order when discountCode is explicitly null', () => {
    const order = service.createOrder({
      customerId: 'cus_4',
      items: [
        { sku: 'A', quantity: 1, unitPriceCents: 500 },
        { sku: 'B', quantity: 3, unitPriceCents: 250 },
      ],
      discountCode: null,
    });

    assert.equal(order.customerId, 'cus_4');
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
