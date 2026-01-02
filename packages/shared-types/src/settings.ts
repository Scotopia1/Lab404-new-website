import type { UUID, ISODateString, Decimal, CurrencyCode, Address } from './common';

// ===========================================
// Settings Types
// ===========================================

export interface PublicSettings {
  storeName: string;
  storeEmail: string;
  storePhone?: string;
  storeAddress?: Address;
  currency: CurrencyCode;
  taxRate: Decimal;
  shippingEnabled: boolean;
  freeShippingThreshold?: Decimal;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

export interface AdminSettings extends PublicSettings {
  smtpConfigured: boolean;
  stripeEnabled: boolean;
  imagekitConfigured: boolean;
  lowStockAlertEnabled: boolean;
  lowStockAlertEmail?: string;
  orderNotificationEmail?: string;
}

export interface Setting {
  id: UUID;
  key: string;
  value: unknown;
  description?: string;
  updatedAt: ISODateString;
}

// ===========================================
// Settings Input Types
// ===========================================

export interface UpdateSettingInput {
  key: string;
  value: unknown;
}

export interface UpdatePublicSettingsInput extends Partial<PublicSettings> {}

export interface UpdateAdminSettingsInput extends Partial<AdminSettings> {}
