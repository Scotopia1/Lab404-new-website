'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { CategoryFilter } from './category-filter';
import { PriceRangeFilter } from './price-range-filter';
import { StockFilter } from './stock-filter';
import type { ProductFilters } from '@/hooks/use-product-filters';

interface MobileFilterSheetProps {
  filters: ProductFilters;
  onCategoryChange: (slug: string | undefined) => void;
  onMinPriceChange: (value: number | undefined) => void;
  onMaxPriceChange: (value: number | undefined) => void;
  onInStockChange: (value: boolean) => void;
  onClearAll: () => void;
  activeFilterCount: number;
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

export function MobileFilterSheet({
  filters,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onInStockChange,
  onClearAll,
  activeFilterCount,
  className,
}: MobileFilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
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
        </div>

        <SheetFooter className="border-t pt-4">
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={onClearAll} className="flex-1">
              Clear All
            </Button>
          )}
          <SheetClose asChild>
            <Button className="flex-1">Apply Filters</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
