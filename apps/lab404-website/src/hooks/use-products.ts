import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Product {
    id: string;
    name: string;
    slug: string;
    sku: string;
    description?: string;
    shortDescription?: string;
    price?: string;
    basePrice?: number;
    compareAtPrice?: string;
    stockQuantity: number;
    featured?: boolean;
    isFeatured?: boolean;
    thumbnailUrl?: string;
    images?: { url: string; alt: string; isPrimary: boolean }[];
    category?: { id: string; name: string; slug: string };
    categoryId?: string;
    inStock?: boolean;
    features?: string[];
    specifications?: Record<string, string>;
    tags?: string[];
}

interface ProductsResponse {
    success: boolean;
    data: Product[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface UseProductsParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export function useProducts(params: UseProductsParams = {}) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            const { data } = await api.get<ProductsResponse>('/products', { params });
            return data;
        },
    });
}

export function useProduct(slug: string) {
    return useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const { data } = await api.get<{ success: boolean; data: Product }>(`/products/${slug}`);
            return data.data;
        },
        enabled: !!slug,
    });
}

export function useFeaturedProducts(limit = 8) {
    return useQuery({
        queryKey: ['products', 'featured', limit],
        queryFn: async () => {
            const { data } = await api.get<{ success: boolean; data: Product[] }>('/products/featured', {
                params: { limit },
            });
            return data.data;
        },
    });
}

export function useRelatedProducts(categoryId: string | undefined, currentProductId: string, limit = 4) {
    return useQuery({
        queryKey: ['products', 'related', categoryId, currentProductId, limit],
        queryFn: async () => {
            const { data } = await api.get<ProductsResponse>('/products', {
                params: { category: categoryId, limit: limit + 1 },
            });
            // Filter out the current product
            return data.data.filter(p => p.id !== currentProductId).slice(0, limit);
        },
        enabled: !!categoryId,
    });
}
