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
  destination: ShippingDestination;
}
