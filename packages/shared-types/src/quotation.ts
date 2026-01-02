import type { UUID, ISODateString, Decimal, CurrencyCode, Address } from './common';

// ===========================================
// Quotation Enums
// ===========================================

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

// ===========================================
// Quotation Types
// ===========================================

export interface QuotationItem {
  id: UUID;
  quotationId: UUID;
  productId?: UUID;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: Decimal;
  lineTotal: Decimal;
  createdAt: ISODateString;
}

export interface Quotation {
  id: UUID;
  quotationNumber: string;
  customerId?: UUID;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: Address;
  status: QuotationStatus;
  validUntil?: ISODateString;
  currency: CurrencyCode;
  subtotal: Decimal;
  taxRate?: Decimal;
  taxAmount?: Decimal;
  discountAmount: Decimal;
  total: Decimal;
  items: QuotationItem[];
  notes?: string;
  termsAndConditions?: string;
  pdfUrl?: string;
  convertedToOrderId?: UUID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface QuotationListItem {
  id: UUID;
  quotationNumber: string;
  customerName: string;
  customerEmail: string;
  status: QuotationStatus;
  total: Decimal;
  validUntil?: ISODateString;
  createdAt: ISODateString;
}

// ===========================================
// Quotation Input Types
// ===========================================

export interface QuotationItemInput {
  productId?: UUID;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: Decimal;
}

export interface CreateQuotationInput {
  customerId?: UUID;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: Address;
  validUntil?: ISODateString;
  items: QuotationItemInput[];
  notes?: string;
  termsAndConditions?: string;
  taxRate?: Decimal;
  discountAmount?: Decimal;
}

export interface UpdateQuotationInput extends Partial<CreateQuotationInput> {
  id: UUID;
  status?: QuotationStatus;
}
