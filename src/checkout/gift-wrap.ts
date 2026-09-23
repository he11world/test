import type { GiftWrapStyle } from './types.ts';

export interface GiftWrapPrice {
  cents: number;
  label: string;
}

/**
 * Flat gift-wrap prices, charged once per order.
 */
export const GIFT_WRAP_PRICES: Record<string, GiftWrapPrice> = {
  standard: { cents: 299, label: 'Standard gift wrap' },
};

export function giftWrapPrice(style: GiftWrapStyle): GiftWrapPrice {
  return GIFT_WRAP_PRICES[style];
}
