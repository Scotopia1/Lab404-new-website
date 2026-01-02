import type { UUID, ISODateString } from './common';

// ===========================================
// Category Types
// ===========================================

export interface Category {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: UUID;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CategoryListItem {
  id: UUID;
  name: string;
  slug: string;
  imageUrl?: string;
  parentId?: UUID;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
}

// ===========================================
// Category Input Types
// ===========================================

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: UUID;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: UUID;
}
