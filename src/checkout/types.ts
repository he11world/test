export interface DiscountCode {
  value: string;
  percentOff: number;
}

export interface ShippingDestination {
  country: string;
  postcode: string;
}

export interface OrderRequest {
  customerId: string;
  items: { sku: string; quantity: number; unitPriceCents: number }[];
  discountCode?: DiscountCode | null;
  /**
   * Optional on the wire: request bodies arrive as unvalidated JSON cast to this
   * type, so the service must check for it at runtime rather than assume it.
   */
  destination?: ShippingDestination;
}
