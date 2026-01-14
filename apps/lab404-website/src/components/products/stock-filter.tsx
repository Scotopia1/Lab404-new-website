'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StockFilterProps {
  inStock: boolean;
  onInStockChange: (value: boolean) => void;
}

export function StockFilter({ inStock, onInStockChange }: StockFilterProps) {
  return (
    <button
      type="button"
      onClick={() => onInStockChange(!inStock)}
      className={cn(
        'w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition-colors',
        'hover:bg-muted',
        inStock && 'bg-muted'
      )}
    >
      <div
        className={cn(
          'h-4 w-4 rounded border flex items-center justify-center shrink-0',
          inStock
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-input'
        )}
      >
        {inStock && <Check className="h-3 w-3" />}
      </div>
      <span>In Stock Only</span>
    </button>
  );
}
