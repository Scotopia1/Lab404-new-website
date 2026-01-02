import type { UUID, ISODateString, PaginationParams, SortParams } from './common';

// ===========================================
// Blog Enums
// ===========================================

export type BlogStatus = 'draft' | 'published' | 'archived';

// ===========================================
// Blog Types
// ===========================================

export interface Blog {
  id: UUID;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImageUrl?: string;
  authorId?: UUID;
  authorName?: string;
  status: BlogStatus;
  publishedAt?: ISODateString;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface BlogListItem {
  id: UUID;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImageUrl?: string;
  authorName?: string;
  publishedAt?: ISODateString;
  tags?: string[];
}

// ===========================================
// Blog Input Types
// ===========================================

export interface CreateBlogInput {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featuredImageUrl?: string;
  status?: BlogStatus;
  publishedAt?: ISODateString;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {
  id: UUID;
}

// ===========================================
// Blog Filter Types
// ===========================================

export interface BlogFilters extends PaginationParams, SortParams {
  status?: BlogStatus;
  tag?: string;
  search?: string;
  sortBy?: 'createdAt' | 'publishedAt' | 'title';
}
