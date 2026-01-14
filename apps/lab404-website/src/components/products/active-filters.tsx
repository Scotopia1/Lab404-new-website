'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-categories';
import type { ProductFilters } from '@/hooks/use-product-filters';

interface ActiveFiltersProps {
  filters: ProductFilters;
  onClearFilter: (key: keyof ProductFilters) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilters({
  filters,
  onClearFilter,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  const { data: categories } = useCategories();

  // Get category name from slug
  const categoryName = filters.category
    ? categories?.find((c) => c.slug === filters.category)?.name || filters.category
    : null;

  // Build list of active filters
  const activeFilters: { key: keyof ProductFilters; label: string }[] = [];

  if (filters.search) {
    activeFilters.push({ key: 'search', label: `Search: "${filters.search}"` });
  }
  if (filters.category && categoryName) {
    activeFilters.push({ key: 'category', label: `Category: ${categoryName}` });
  }
  if (filters.minPrice !== undefined) {
    activeFilters.push({ key: 'minPrice', label: `Min: $${filters.minPrice}` });
  }
  if (filters.maxPrice !== undefined) {
    activeFilters.push({ key: 'maxPrice', label: `Max: $${filters.maxPrice}` });
  }
  if (filters.inStock) {
    activeFilters.push({ key: 'inStock', label: 'In Stock' });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {activeFilters.map(({ key, label }) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
          >
            {label}
            <button
              type="button"
              onClick={() => onClearFilter(key)}
              className="ml-1 hover:bg-muted-foreground/20 rounded p-0.5"
              aria-label={`Remove ${label} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground hover:text-foreground h-auto py-1"
        >
          Clear all
        </Button>
      </div>
    </div>
  );
}
