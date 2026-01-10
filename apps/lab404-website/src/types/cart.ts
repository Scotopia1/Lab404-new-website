// Cart types - synced from @lab404/shared-types
// This is a duplicate to avoid complex monorepo builds on Vercel

export interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  thumbnailUrl?: string;
  basePrice: number;
  stockQuantity: number;
  inStock: boolean;
}

export interface CartItemVariant {
  id: string;
  name: string;
  sku: string;
  options: Record<string, string>;
  basePrice: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  product: CartItemProduct;
  variant?: CartItemVariant;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartCalculation {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  promoCode?: string;
  promoCodeId?: string;
  eligibleItemIds?: string[];
  total: number;
  currency: string;
}
