import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CheckoutService } from '../src/checkout/service.ts';

/**
 * Reproduction for the production 500s on POST /orders.
 *
 * `OrderRequest.discountCode` is optional/nullable, but `createOrder` dereferences
 * it unconditionally (`code.percentOff`, `code.value`). A checkout submitted without
 * a discount code therefore throws
 * `TypeError: Cannot read properties of undefined (reading 'percentOff')`
 * at src/checkout/service.ts:22, which the server turns into a 500.
 *
 * Correct behaviour: no discount code means no discount — zero discountCents,
 * total equal to subtotal, and a null appliedCode.
 */
describe('CheckoutService without a discount code', () => {
  const service = new CheckoutService();

  it('charges the full subtotal when discountCode is omitted', () => {
    const order = service.createOrder({
      customerId: 'cus_1',
      items: [{ sku: 'A', quantity: 1, unitPriceCents: 1000 }],
    });

    assert.equal(order.customerId, 'cus_1');
    assert.equal(order.subtotalCents, 1000);
    assert.equal(order.discountCents, 0);
    assert.equal(order.totalCents, 1000);
    assert.equal(order.appliedCode, null);
  });

  it('charges the full subtotal when discountCode is explicitly null', () => {
    const order = service.createOrder({
      customerId: 'cus_2',
      items: [
        { sku: 'A', quantity: 2, unitPriceCents: 750 },
        { sku: 'B', quantity: 1, unitPriceCents: 500 },
      ],
      discountCode: null,
    });

    assert.equal(order.subtotalCents, 2000);
    assert.equal(order.discountCents, 0);
    assert.equal(order.totalCents, 2000);
    assert.equal(order.appliedCode, null);
  });

  it('still applies a discount when a code is supplied', () => {
    const order = service.createOrder({
      customerId: 'cus_3',
      items: [{ sku: 'A', quantity: 2, unitPriceCents: 1000 }],
      discountCode: { value: 'SAVE10', percentOff: 10 },
    });

    assert.equal(order.subtotalCents, 2000);
    assert.equal(order.discountCents, 200);
    assert.equal(order.totalCents, 1800);
    assert.equal(order.appliedCode, 'SAVE10');
  });
});
