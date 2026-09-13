import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CheckoutService } from '../src/checkout/service.ts';

/**
 * Covers the path no existing case exercises: an order submitted WITHOUT a
 * discount code. OrderRequest.discountCode is optional and nullable, but
 * CheckoutService.createOrder dereferences it unconditionally, so these orders
 * throw a TypeError and surface as HTTP 500 checkout_failed on POST /orders.
 */
describe('CheckoutService without a discount code', () => {
  const service = new CheckoutService();

  it('computes an order when discountCode is omitted', () => {
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

  it('computes an order when discountCode is explicitly null', () => {
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
    assert.equal(order.discountCents, 200);
    assert.equal(order.totalCents, 1800);
    assert.equal(order.appliedCode, 'SAVE10');
  });
});
