import type { UUID, ISODateString, Decimal, CurrencyCode, Address, PaginationParams, SortParams } from './common';
import type { Customer } from './customer';

// ===========================================
// Order Enums
// ===========================================

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'cod' | 'stripe' | 'paypal';

// ===========================================
// Order Types
// ===========================================

export interface OrderItem {
  id: UUID;
  orderId: UUID;
  productId: UUID;
  variantId?: UUID;
  productNameSnapshot: string;
  skuSnapshot: string;
  variantOptionsSnapshot?: Record<string, string>;
  quantity: number;
  unitPriceSnapshot: Decimal;
  lineTotalSnapshot: Decimal;
  createdAt: ISODateString;
}

export interface Order {
  id: UUID;
  orderNumber: string;
  customerId?: UUID;
  customer?: Customer;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  billingAddress: Address;
  currency: CurrencyCode;
  subtotalSnapshot: Decimal;
  taxRateSnapshot: Decimal;
  taxAmountSnapshot: Decimal;
  shippingAmountSnapshot: Decimal;
  discountAmountSnapshot: Decimal;
  totalSnapshot: Decimal;
  promoCodeId?: UUID;
  promoCodeSnapshot?: string;
  paymentMethod: PaymentMethod;
  shippingMethod?: string;
  trackingNumber?: string;
  shippedAt?: ISODateString;
  deliveredAt?: ISODateString;
  customerNotes?: string;
  adminNotes?: string;
  items: OrderItem[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OrderListItem {
  id: UUID;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalSnapshot: Decimal;
  itemCount: number;
  createdAt: ISODateString;
}

// ===========================================
// Order Input Types
// ===========================================

export interface CreateOrderInput {
  shippingAddress: Address;
  billingAddress?: Address;
  sameAsShipping?: boolean;
  customerEmail: string;
  customerNotes?: string;
  paymentMethod: PaymentMethod;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingNumber?: string;
  shippingMethod?: string;
  adminNotes?: string;
}

// ===========================================
// Order Filter Types
// ===========================================

export interface OrderFilters extends PaginationParams, SortParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: UUID;
  search?: string;
  startDate?: ISODateString;
  endDate?: ISODateString;
  sortBy?: 'createdAt' | 'totalSnapshot' | 'orderNumber';
}

// ===========================================
// Order Tracking Types
// ===========================================

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: ISODateString;
  description: string;
}

export interface OrderTrackingResponse {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingMethod?: string;
  trackingNumber?: string;
  estimatedDelivery?: ISODateString;
  timeline: OrderTimelineEvent[];
}
