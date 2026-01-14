'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CategoryFilter } from './category-filter';
import { PriceRangeFilter } from './price-range-filter';
import { StockFilter } from './stock-filter';
import type { ProductFilters } from '@/hooks/use-product-filters';

interface ProductFiltersProps {
  filters: ProductFilters;
  onCategoryChange: (slug: string | undefined) => void;
  onMinPriceChange: (value: number | undefined) => void;
  onMaxPriceChange: (value: number | undefined) => void;
  onInStockChange: (value: boolean) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm">{title}</h3>
      {children}
    </div>
  );
}

export function ProductFilters({
  filters,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onInStockChange,
  onClearAll,
  hasActiveFilters,
  className,
}: ProductFiltersProps) {
  return (
    <aside className={cn('w-64 flex-shrink-0 space-y-6', className)}>
      <FilterSection title="Categories">
        <CategoryFilter
          selectedCategory={filters.category}
          onCategoryChange={onCategoryChange}
        />
      </FilterSection>

      <FilterSection title="Price Range">
        <PriceRangeFilter
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onMinPriceChange={onMinPriceChange}
          onMaxPriceChange={onMaxPriceChange}
        />
      </FilterSection>

      <FilterSection title="Availability">
        <StockFilter
          inStock={filters.inStock}
          onInStockChange={onInStockChange}
        />
      </FilterSection>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="w-full"
        >
          Clear All Filters
        </Button>
      )}
    </aside>
  );
}
