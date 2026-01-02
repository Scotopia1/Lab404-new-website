import type { UUID, ISODateString, Decimal, ImageObject, PaginationParams, SortParams } from './common';
import type { Category } from './category';

// ===========================================
// Product Enums
// ===========================================

export type ProductStatus = 'draft' | 'active' | 'archived';

// ===========================================
// Product Types
// ===========================================

export interface Product {
  id: UUID;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categoryId?: UUID;
  category?: Category;
  brand?: string;

  // Pricing
  basePrice: Decimal;
  costPrice?: Decimal;
  compareAtPrice?: Decimal;

  // Inventory
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  inStock: boolean;

  // Media
  images: ImageObject[];
  thumbnailUrl?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Status
  status: ProductStatus;
  isFeatured: boolean;

  // Import tracking
  importedFrom?: string;
  externalUrl?: string;

  // Timestamps
  createdAt: ISODateString;
  updatedAt: ISODateString;

  // Relations
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: UUID;
  productId: UUID;
  sku: string;
  name: string;
  options: Record<string, string>;
  basePrice: Decimal;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ProductListItem {
  id: UUID;
  sku: string;
  name: string;
  slug: string;
  thumbnailUrl?: string;
  basePrice: Decimal;
  compareAtPrice?: Decimal;
  stockQuantity: number;
  inStock: boolean;
  status: ProductStatus;
  isFeatured: boolean;
  category?: {
    id: UUID;
    name: string;
    slug: string;
  };
}

// ===========================================
// Product Input Types
// ===========================================

export interface CreateProductInput {
  sku: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: UUID;
  brand?: string;
  basePrice: Decimal;
  costPrice?: Decimal;
  compareAtPrice?: Decimal;
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  images?: ImageObject[];
  thumbnailUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: UUID;
}

export interface CreateProductVariantInput {
  productId: UUID;
  sku: string;
  name: string;
  options: Record<string, string>;
  basePrice: Decimal;
  stockQuantity?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateProductVariantInput extends Partial<Omit<CreateProductVariantInput, 'productId'>> {
  id: UUID;
}

// ===========================================
// Product Filter Types
// ===========================================

export interface ProductFilters extends PaginationParams, SortParams {
  search?: string;
  categoryId?: UUID;
  categorySlug?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  minPrice?: Decimal;
  maxPrice?: Decimal;
  inStock?: boolean;
  brand?: string;
  sortBy?: 'name' | 'basePrice' | 'createdAt' | 'stockQuantity';
}

// ===========================================
// Product Import Types
// ===========================================

export type ImportSource = 'amazon' | 'aliexpress' | 'ebay';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProductImportJob {
  id: UUID;
  source: ImportSource;
  sourceUrl: string;
  status: ImportStatus;
  importedProductId?: UUID;
  errorMessage?: string;
  rawData?: Record<string, unknown>;
  createdAt: ISODateString;
  completedAt?: ISODateString;
}

export interface ProductImportPreview {
  source: ImportSource;
  sourceUrl: string;
  extractedData: {
    name: string;
    description?: string;
    price?: Decimal;
    images?: string[];
    specifications?: Record<string, string>;
  };
}

export interface CreateProductImportInput {
  sourceUrl: string;
  categoryId?: UUID;
  sku?: string;
  priceOverride?: Decimal;
}
