import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ===========================================
// Types
// ===========================================

export interface SearchHit {
    id: string;
    sku: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    brand: string | null;
    categoryId: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    basePrice: number;
    compareAtPrice: number | null;
    stockQuantity: number;
    inStock: boolean;
    isFeatured: boolean;
    tags: string[];
    thumbnailUrl: string | null;
    images: Array<{ url: string; alt?: string }>;
}

export interface SearchResult {
    hits: SearchHit[];
    query: string;
    processingTimeMs: number;
    estimatedTotalHits: number;
    limit: number;
    offset: number;
    facetDistribution?: Record<string, Record<string, number>>;
}

export interface AutocompleteSuggestion {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl: string | null;
    basePrice: number;
    categoryName: string | null;
}

export interface AutocompleteResult {
    suggestions: AutocompleteSuggestion[];
    query: string;
}

export interface SearchParams {
    q: string;
    limit?: number;
    offset?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    brand?: string;
    sort?: 'name:asc' | 'name:desc' | 'basePrice:asc' | 'basePrice:desc' | 'createdAt:desc';
    facets?: string;
}

// ===========================================
// API Functions
// ===========================================

async function searchProducts(params: SearchParams): Promise<SearchResult> {
    const searchParams = new URLSearchParams();

    searchParams.set('q', params.q);

    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    if (params.category) searchParams.set('category', params.category);
    if (params.minPrice !== undefined) searchParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) searchParams.set('maxPrice', String(params.maxPrice));
    if (params.inStock !== undefined) searchParams.set('inStock', String(params.inStock));
    if (params.brand) searchParams.set('brand', params.brand);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.facets) searchParams.set('facets', params.facets);

    const response = await api.get<{ data: SearchResult }>(`/search?${searchParams.toString()}`);
    return response.data.data;
}

async function getAutocomplete(query: string, limit = 5): Promise<AutocompleteResult> {
    const response = await api.get<{ data: AutocompleteResult }>(
        `/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data.data;
}

// ===========================================
// Hooks
// ===========================================

/**
 * Full-text search hook with filters and facets
 */
export function useSearch(params: SearchParams | null, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['search', params],
        queryFn: () => searchProducts(params!),
        enabled: options?.enabled !== false && !!params?.q && params.q.length > 0,
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * Autocomplete suggestions hook
 */
export function useAutocomplete(query: string, limit = 5, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['autocomplete', query, limit],
        queryFn: () => getAutocomplete(query, limit),
        enabled: options?.enabled !== false && query.length >= 2,
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Search health check hook
 */
export function useSearchHealth() {
    return useQuery({
        queryKey: ['search-health'],
        queryFn: async () => {
            const response = await api.get<{ data: { available: boolean; stats: unknown } }>('/search/health');
            return response.data.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
