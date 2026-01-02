import type { UUID, ISODateString, Decimal, CurrencyCode } from './common';

// ===========================================
// Cart Types
// ===========================================

export interface CartItemProduct {
  id: UUID;
  name: string;
  slug: string;
  sku: string;
  thumbnailUrl?: string;
  basePrice: Decimal;
  stockQuantity: number;
  inStock: boolean;
}

export interface CartItemVariant {
  id: UUID;
  name: string;
  sku: string;
  options: Record<string, string>;
  basePrice: Decimal;
}

export interface CartItem {
  id: UUID;
  productId: UUID;
  variantId?: UUID;
  product: CartItemProduct;
  variant?: CartItemVariant;
  quantity: number;
  unitPrice: Decimal;
  lineTotal: Decimal;
}

export interface Cart {
  id: UUID;
  customerId?: UUID;
  sessionId?: string;
  items: CartItem[];
  itemCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Cart calculation response
 * CRITICAL: These values come from the backend only
 * NEVER calculate these on the client side
 */
export interface CartCalculation {
  items: CartItem[];
  itemCount: number;
  /** Sum of all line totals */
  subtotal: Decimal;
  /** Tax rate (e.g., 0.11 for 11%) */
  taxRate: Decimal;
  /** Tax amount = subtotal * taxRate */
  taxAmount: Decimal;
  /** Shipping cost */
  shippingAmount: Decimal;
  /** Discount from promo code */
  discountAmount: Decimal;
  /** Applied promo code string */
  promoCode?: string;
  /** Applied promo code ID */
  promoCodeId?: UUID;
  /** Final total */
  total: Decimal;
  /** Currency code */
  currency: CurrencyCode;
}

// ===========================================
// Cart Input Types
// ===========================================

export interface AddToCartInput {
  productId: UUID;
  variantId?: UUID;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface ApplyPromoCodeInput {
  code: string;
}
