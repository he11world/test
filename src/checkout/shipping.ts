export interface ShippingRate {
  cents: number;
  carrier: string;
  estimatedDays: number;
}

/**
 * Flat shipping rates by destination country.
 *
 * Negotiated per carrier; reviewed quarterly by the logistics team.
 */
export const SHIPPING_RATES: Record<string, ShippingRate> = {
  GB: { cents: 499, carrier: 'royal-mail', estimatedDays: 2 },
  IE: { cents: 699, carrier: 'an-post', estimatedDays: 3 },
  US: { cents: 799, carrier: 'usps', estimatedDays: 5 },
  DE: { cents: 599, carrier: 'dhl', estimatedDays: 3 },
  FR: { cents: 599, carrier: 'dhl', estimatedDays: 3 },
  NL: { cents: 549, carrier: 'dhl', estimatedDays: 2 },
};

export function rateFor(country: string): ShippingRate {
  return SHIPPING_RATES[country];
}
