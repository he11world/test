import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CheckoutService } from '../src/checkout/service.ts';
import type { Order } from '../src/checkout/service.ts';
import type { OrderRequest } from '../src/checkout/types.ts';

type Attempt =
  | { ok: true; order: Order }
  | { ok: false; error: unknown };

function attempt(service: CheckoutService, request: OrderRequest): Attempt {
  try {
    return { ok: true, order: service.createOrder(request) };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * The service must never dereference a missing destination or an unmapped
 * shipping rate. Either it handles the input (returning a well-formed order
 * with a numeric shipping charge) or it rejects it with a deliberate,
 * non-TypeError validation error the HTTP layer can turn into a 400.
 *
 * A TypeError of the form "Cannot read properties of undefined" is the
 * production failure and is never acceptable.
 */
function assertHandledOrRejected(result: Attempt, label: string): void {
  if (result.ok) {
    const order = result.order;
    assert.equal(
      typeof order.shippingCents,
      'number',
      `${label}: expected a numeric shippingCents, got ${String(order.shippingCents)}`,
    );
    assert.ok(
      Number.isFinite(order.shippingCents),
      `${label}: expected a finite shippingCents, got ${String(order.shippingCents)}`,
    );
    assert.equal(
      typeof order.totalCents,
      'number',
      `${label}: expected a numeric totalCents, got ${String(order.totalCents)}`,
    );
    return;
  }

  const error = result.error;
  const name = error instanceof Error ? error.name : 'UnknownError';
  const message = error instanceof Error ? error.message : String(error);

  assert.ok(
    !(error instanceof TypeError),
    `${label}: createOrder threw an unguarded TypeError instead of returning an order or rejecting the input — ${name}: ${message}`,
  );
  assert.ok(
    !message.startsWith('Cannot read properties of undefined'),
    `${label}: createOrder dereferenced undefined instead of validating the input — ${name}: ${message}`,
  );
}

describe('CheckoutService destination handling', () => {
  const service = new CheckoutService();

  it('does not crash when the request has no destination', () => {
    const result = attempt(service, {
      customerId: 'cus_1',
      items: [{ sku: 'A', quantity: 1, unitPriceCents: 1000 }],
    });
    assertHandledOrRejected(result, 'missing destination');
  });

  it('does not crash for a country with no configured shipping rate', () => {
    const result = attempt(service, {
      customerId: 'cus_2',
      items: [{ sku: 'A', quantity: 1, unitPriceCents: 1000 }],
      destination: { country: 'JP', postcode: '100-0001' },
    });
    assertHandledOrRejected(result, 'unmapped country JP');
  });

  it('still prices mapped countries exactly as before', () => {
    const order = service.createOrder({
      customerId: 'cus_3',
      items: [{ sku: 'A', quantity: 2, unitPriceCents: 1000 }],
      discountCode: { value: 'SAVE10', percentOff: 10 },
      destination: { country: 'GB', postcode: 'EC1A 1BB' },
    });
    assert.equal(order.subtotalCents, 2000);
    assert.equal(order.discountCents, 200);
    assert.equal(order.shippingCents, 499);
    assert.equal(order.carrier, 'royal-mail');
    assert.equal(order.totalCents, 2299);
    assert.equal(order.appliedCode, 'SAVE10');
  });
});
