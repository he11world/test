import type { GiftWrapStyle } from './types.ts';

export interface GiftWrapPrice {
  cents: number;
  label: string;
}

/**
 * Flat gift-wrap prices, charged once per order.
 *
 * This map is the runtime source of truth for which styles can actually be
 * priced. `GiftWrapStyle` may name styles that are not yet priced (a style is
 * only sellable once the business has agreed a price for it), so callers must
 * treat a lookup miss as a normal, expected outcome - see `giftWrapPrice`.
 */
export const GIFT_WRAP_PRICES: Record<string, GiftWrapPrice> = {
  standard: { cents: 299, label: 'Standard gift wrap' },
};

/**
 * Look up the flat price for a gift-wrap style.
 *
 * Only the styles in GIFT_WRAP_PRICES are priced, so the lookup can legitimately
 * miss. The return type says so: callers must handle `undefined` rather than
 * dereferencing the result blind.
 *
 * The parameter is a plain `string` on purpose. Request bodies arrive as
 * unvalidated JSON cast to `OrderRequest`, so the `GiftWrapStyle` union carries
 * no runtime force and any string at all can reach this function.
 */
export function giftWrapPrice(style: string): GiftWrapPrice | undefined {
  if (typeof style !== 'string') {
    return undefined;
  }
  // Own-property check so inherited keys ('toString', 'constructor', ...) coming
  // off the wire cannot masquerade as a priced style.
  if (!Object.prototype.hasOwnProperty.call(GIFT_WRAP_PRICES, style)) {
    return undefined;
  }
  return GIFT_WRAP_PRICES[style];
}

export function isSupportedGiftWrapStyle(style: string): boolean {
  return giftWrapPrice(style) !== undefined;
}

export function supportedGiftWrapStyles(): string[] {
  return Object.keys(GIFT_WRAP_PRICES);
}

/** Narrowing helper for callers that hold a validated style. */
export function asSupportedGiftWrapStyle(style: string): GiftWrapStyle | undefined {
  return isSupportedGiftWrapStyle(style) ? (style as GiftWrapStyle) : undefined;
}
