import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CheckoutService } from '../src/checkout/service.ts';
import { CheckoutValidationError } from '../src/checkout/errors.ts';
import { rateFor } from '../src/checkout/shipping.ts';
import type { OrderRequest } from '../src/checkout/types.ts';

function callAndCapture(request: OrderRequest): { error: unknown; order: unknown } {
  try {
    return { error: undefined, order: new CheckoutService().createOrder(request) };
  } catch (error) {
    return { error, order: undefined };
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

describe('CheckoutService with input it cannot price', () => {
  const service = new CheckoutService();

  it('rejects a body with no destination as a validation error, not a raw TypeError', () => {
    const request = {
      customerId: 'cus_missing_dest',
      items: [{ sku: 'A', quantity: 1, unitPriceCents: 1000 }],
    } as unknown as OrderRequest;

    const { error } = callAndCapture(request);

    assert.ok(
      !(error instanceof TypeError),
      `createOrder dereferenced undefined instead of rejecting the input -> ${describeError(error)}`,
    );
    assert.ok(
      !(error instanceof Error && error.message.includes('Cannot read properties of undefined')),
      `createOrder surfaced a dereference of undefined -> ${describeError(error)}`,
    );
    assert.ok(
      error instanceof CheckoutValidationError,
      `expected CheckoutValidationError, got -> ${describeError(error)}`,
    );
    assert.equal((error as CheckoutValidationError).code, 'missing_destination');
  });

  it('rejects an unsupported shipping country as a validation error, not a raw TypeError', () => {
    const request: OrderRequest = {
      customerId: 'cus_unsupported_country',
      items: [{ sku: 'A', quantity: 1, unitPriceCents: 1000 }],
      destination: { country: 'ZZ', postcode: '00000' },
    };

    const { error } = callAndCapture(request);

    assert.ok(
      !(error instanceof TypeError),
      `createOrder dereferenced an undefined shipping rate -> ${describeError(error)}`,
    );
    assert.ok(
      !(error instanceof Error && error.message.includes('Cannot read properties of undefined')),
      `createOrder surfaced a dereference of undefined -> ${describeError(error)}`,
    );
    assert.ok(
      error instanceof CheckoutValidationError,
      `expected CheckoutValidationError, got -> ${describeError(error)}`,
    );
    assert.equal((error as CheckoutValidationError).code, 'unsupported_shipping_country');
  });

  it('rateFor returns undefined for a country that is not priced', () => {
    assert.equal(rateFor('ZZ'), undefined);
    assert.deepEqual(rateFor('GB'), { cents: 499, carrier: 'royal-mail', estimatedDays: 2 });
  });

  it('still prices supported destinations exactly as before', () => {
    const discounted = service.createOrder({
      customerId: 'cus_1',
      items: [{ sku: 'A', quantity: 2, unitPriceCents: 1000 }],
      discountCode: { value: 'SAVE10', percentOff: 10 },
      destination: { country: 'GB', postcode: 'EC1A 1BB' },
    });
    assert.equal(discounted.subtotalCents, 2000);
    assert.equal(discounted.discountCents, 200);
    assert.equal(discounted.shippingCents, 499);
    assert.equal(discounted.totalCents, 2299);
    assert.equal(discounted.appliedCode, 'SAVE10');

    const plain = service.createOrder({
      customerId: 'cus_3',
      items: [{ sku: 'A', quantity: 1, unitPriceCents: 500 }],
      destination: { country: 'US', postcode: '10001' },
    });
    assert.equal(plain.shippingCents, 799);
    assert.equal(plain.carrier, 'usps');
    assert.equal(plain.totalCents, 1299);
    assert.equal(plain.appliedCode, null);
  });
});
