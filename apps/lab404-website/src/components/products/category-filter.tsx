'use client';

import { useCategories } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string | undefined;
  onCategoryChange: (slug: string | undefined) => void;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {/* All Categories option */}
      <button
        type="button"
        onClick={() => onCategoryChange(undefined)}
        className={cn(
          'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors',
          'hover:bg-muted',
          !selectedCategory && 'bg-muted font-medium'
        )}
      >
        <span>All Categories</span>
        {!selectedCategory && <Check className="h-4 w-4" />}
      </button>

      {/* Category options */}
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onCategoryChange(category.slug)}
          className={cn(
            'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors',
            'hover:bg-muted',
            selectedCategory === category.slug && 'bg-muted font-medium'
          )}
        >
          <span>{category.name}</span>
          {selectedCategory === category.slug && <Check className="h-4 w-4" />}
        </button>
      ))}
    </div>
  );
}
