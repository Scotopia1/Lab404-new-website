import type { UUID, ISODateString, Decimal } from './common';

// ===========================================
// Promo Code Enums
// ===========================================

export type DiscountType = 'percentage' | 'fixed_amount';

// ===========================================
// Promo Code Types
// ===========================================

export interface PromoCode {
  id: UUID;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: Decimal;
  minimumOrderAmount?: Decimal;
  maximumDiscountAmount?: Decimal;
  usageLimit?: number;
  usageCount: number;
  usageLimitPerCustomer: number;
  startsAt?: ISODateString;
  expiresAt?: ISODateString;
  isActive: boolean;
  appliesToProducts?: UUID[];
  appliesToCategories?: UUID[];
  customerIds?: UUID[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PromoCodeListItem {
  id: UUID;
  code: string;
  discountType: DiscountType;
  discountValue: Decimal;
  usageCount: number;
  usageLimit?: number;
  isActive: boolean;
  expiresAt?: ISODateString;
}

// ===========================================
// Promo Code Input Types
// ===========================================

export interface CreatePromoCodeInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: Decimal;
  minimumOrderAmount?: Decimal;
  maximumDiscountAmount?: Decimal;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  startsAt?: ISODateString;
  expiresAt?: ISODateString;
  isActive?: boolean;
  appliesToProducts?: UUID[];
  appliesToCategories?: UUID[];
  customerIds?: UUID[];
}

export interface UpdatePromoCodeInput extends Partial<CreatePromoCodeInput> {
  id: UUID;
}

// ===========================================
// Promo Code Validation Types
// ===========================================

export type PromoCodeErrorCode =
  | 'INVALID_CODE'
  | 'EXPIRED'
  | 'NOT_STARTED'
  | 'USAGE_LIMIT'
  | 'CUSTOMER_LIMIT'
  | 'MINIMUM_NOT_MET'
  | 'NOT_APPLICABLE'
  | 'INACTIVE';

export interface PromoCodeValidation {
  isValid: boolean;
  code: string;
  discountType?: DiscountType;
  discountValue?: Decimal;
  calculatedDiscount?: Decimal;
  message?: string;
  errorCode?: PromoCodeErrorCode;
}
