'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';

export interface ProductFilters {
  search: string;
  category: string | undefined;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  inStock: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
}

export interface UseProductFiltersReturn {
  filters: ProductFilters;
  setSearch: (value: string) => void;
  setCategory: (slug: string | undefined) => void;
  setMinPrice: (value: number | undefined) => void;
  setMaxPrice: (value: number | undefined) => void;
  setInStock: (value: boolean) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  clearFilter: (key: keyof ProductFilters) => void;
  clearAllFilters: () => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  isPending: boolean;
}

const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  category: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  inStock: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
};

export function useProductFilters(): UseProductFiltersReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Parse current filters from URL
  const filters = useMemo<ProductFilters>(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || undefined;
    const minPriceStr = searchParams.get('minPrice');
    const maxPriceStr = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const page = Number(searchParams.get('page')) || 1;

    return {
      search,
      category,
      minPrice: minPriceStr ? Number(minPriceStr) : undefined,
      maxPrice: maxPriceStr ? Number(maxPriceStr) : undefined,
      inStock,
      sortBy,
      sortOrder,
      page,
    };
  }, [searchParams]);

  // Update URL with new params
  const updateURL = useCallback(
    (updates: Partial<ProductFilters>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === false) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // Reset page to 1 when filters change (except when explicitly setting page)
      if (resetPage && !('page' in updates)) {
        params.delete('page');
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, router, pathname]
  );

  // Individual setters
  const setSearch = useCallback(
    (value: string) => updateURL({ search: value }),
    [updateURL]
  );

  const setCategory = useCallback(
    (slug: string | undefined) => updateURL({ category: slug }),
    [updateURL]
  );

  const setMinPrice = useCallback(
    (value: number | undefined) => updateURL({ minPrice: value }),
    [updateURL]
  );

  const setMaxPrice = useCallback(
    (value: number | undefined) => updateURL({ maxPrice: value }),
    [updateURL]
  );

  const setInStock = useCallback(
    (value: boolean) => updateURL({ inStock: value }),
    [updateURL]
  );

  const setSort = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc') =>
      updateURL({ sortBy, sortOrder }),
    [updateURL]
  );

  const setPage = useCallback(
    (page: number) => updateURL({ page }, false),
    [updateURL]
  );

  // Clear individual filter
  const clearFilter = useCallback(
    (key: keyof ProductFilters) => {
      updateURL({ [key]: DEFAULT_FILTERS[key] });
    },
    [updateURL]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [router, pathname]);

  // Count active filters (excluding sort and page)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.inStock) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters,
    setSearch,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setInStock,
    setSort,
    setPage,
    clearFilter,
    clearAllFilters,
    activeFilterCount,
    hasActiveFilters,
    isPending,
  };
}
