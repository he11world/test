/**
 * A request the checkout service cannot price. This is a deliberate, typed
 * rejection of bad input - never a dereference of undefined - so the HTTP layer
 * can map it to a 4xx with a machine-readable code instead of a 500.
 */
export class CheckoutValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'CheckoutValidationError';
    this.code = code;
  }
}
