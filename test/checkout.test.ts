import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CheckoutService } from '../src/checkout/service.ts';

describe('CheckoutService', () => {
  const service = new CheckoutService();
  const destination = { country: 'GB', postcode: 'EC1A 1BB' };

  it('applies a percentage discount', () => {
    const order = service.createOrder({
      customerId: 'cus_1',
      items: [{ sku: 'A', quantity: 2, unitPriceCents: 1000 }],
      discountCode: { value: 'SAVE10', percentOff: 10 },
      destination,
    });
    assert.equal(order.subtotalCents, 2000);
    assert.equal(order.discountCents, 200);
    assert.equal(order.totalCents, 2299);
    assert.equal(order.appliedCode, 'SAVE10');
  });

  it('charges no discount when no code is supplied', () => {
    const order = service.createOrder({
      customerId: 'cus_2',
      items: [{ sku: 'A', quantity: 1, unitPriceCents: 1000 }],
      destination,
    });
    assert.equal(order.discountCents, 0);
    assert.equal(order.appliedCode, null);
    assert.equal(order.totalCents, 1499);
  });

  it('adds shipping for the destination country', () => {
    const order = service.createOrder({
      customerId: 'cus_3',
      items: [{ sku: 'A', quantity: 1, unitPriceCents: 500 }],
      destination: { country: 'US', postcode: '10001' },
    });
    assert.equal(order.shippingCents, 799);
    assert.equal(order.carrier, 'usps');
    assert.equal(order.totalCents, 1299);
  });
});
