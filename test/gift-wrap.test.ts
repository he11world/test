import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CheckoutService } from '../src/checkout/service.ts';

describe('gift wrap', () => {
  const service = new CheckoutService();
  const destination = { country: 'GB', postcode: 'EC1A 1BB' };
  const items = [{ sku: 'A', quantity: 1, unitPriceCents: 1000 }];

  it('adds the wrap price to the total', () => {
    const order = service.createOrder({ customerId: 'cus_7', items, destination, giftWrap: { style: 'standard' } });
    assert.equal(order.giftWrapCents, 299);
    assert.equal(order.totalCents, 1000 + 499 + 299);
  });

  it('charges nothing when no wrap is requested', () => {
    const order = service.createOrder({ customerId: 'cus_8', items, destination });
    assert.equal(order.giftWrapCents, 0);
    assert.equal(order.totalCents, 1499);
  });
});
