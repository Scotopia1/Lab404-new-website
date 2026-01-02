import type { UUID, ISODateString, Decimal, Address, PaginationParams, SortParams } from './common';

// ===========================================
// Customer Types
// ===========================================

export interface Customer {
  id: UUID;
  authUserId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  defaultShippingAddress?: Address;
  defaultBillingAddress?: Address;
  addresses?: SavedAddress[];
  isGuest: boolean;
  acceptsMarketing: boolean;
  notes?: string;
  tags?: string[];
  orderCount: number;
  totalSpent?: Decimal;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SavedAddress extends Address {
  id: UUID;
  customerId: UUID;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CustomerListItem {
  id: UUID;
  email: string;
  fullName?: string;
  phone?: string;
  isGuest: boolean;
  orderCount: number;
  createdAt: ISODateString;
}

// ===========================================
// Customer Input Types
// ===========================================

export interface CreateCustomerInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  notes?: string;
  tags?: string[];
}

export interface CreateAddressInput extends Address {
  type: 'shipping' | 'billing';
  isDefault?: boolean;
}

export interface UpdateAddressInput extends Partial<CreateAddressInput> {
  id: UUID;
}

// ===========================================
// Customer Filter Types
// ===========================================

export interface CustomerFilters extends PaginationParams, SortParams {
  search?: string;
  isGuest?: boolean;
  hasOrders?: boolean;
  sortBy?: 'createdAt' | 'orderCount' | 'email';
}
