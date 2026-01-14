'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SortSelectProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  className?: string;
}

const SORT_OPTIONS = [
  { label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' as const },
  { label: 'Name A-Z', sortBy: 'name', sortOrder: 'asc' as const },
  { label: 'Name Z-A', sortBy: 'name', sortOrder: 'desc' as const },
  { label: 'Price: Low to High', sortBy: 'basePrice', sortOrder: 'asc' as const },
  { label: 'Price: High to Low', sortBy: 'basePrice', sortOrder: 'desc' as const },
];

export function SortSelect({
  sortBy,
  sortOrder,
  onSortChange,
  className,
}: SortSelectProps) {
  const currentOption = SORT_OPTIONS.find(
    (opt) => opt.sortBy === sortBy && opt.sortOrder === sortOrder
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [newSortBy, newSortOrder] = e.target.value.split(':');
    onSortChange(newSortBy, newSortOrder as 'asc' | 'desc');
  };

  return (
    <div className={cn('relative', className)}>
      <select
        value={`${sortBy}:${sortOrder}`}
        onChange={handleChange}
        className={cn(
          'appearance-none bg-background border border-input rounded-md',
          'px-3 py-2 pr-8 text-sm cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'min-h-[40px]'
        )}
      >
        {SORT_OPTIONS.map((option) => (
          <option
            key={`${option.sortBy}:${option.sortOrder}`}
            value={`${option.sortBy}:${option.sortOrder}`}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
    </div>
  );
}
