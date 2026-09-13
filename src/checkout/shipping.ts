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

/**
 * Look up the flat rate for a country.
 *
 * Only the countries in SHIPPING_RATES are priced, so the lookup can legitimately
 * miss. The return type says so: callers must handle `undefined` rather than
 * dereferencing the result blind.
 */
export function rateFor(country: string): ShippingRate | undefined {
  return SHIPPING_RATES[country];
}

export function isSupportedCountry(country: string): boolean {
  return rateFor(country) !== undefined;
}

export function supportedCountries(): string[] {
  return Object.keys(SHIPPING_RATES);
}
