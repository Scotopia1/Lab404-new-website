// ===========================================
// Common Types
// ===========================================

/** UUID type alias */
export type UUID = string;

/** ISO date string */
export type ISODateString = string;

/** Currency code */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'AED' | 'LBP' | string;

/** Decimal number (for prices) */
export type Decimal = number;

// ===========================================
// API Response Types
// ===========================================

export interface ApiError {
  code: string;
  message: string;
  details?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
};

export type ErrorResponse = {
  success: false;
  error: ApiError;
};

// ===========================================
// Image & Address Types
// ===========================================

export interface ImageObject {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  fileId?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

// ===========================================
// Pagination Types
// ===========================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
