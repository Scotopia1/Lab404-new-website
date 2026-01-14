'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';

interface PriceRangeFilterProps {
  minPrice: number | undefined;
  maxPrice: number | undefined;
  onMinPriceChange: (value: number | undefined) => void;
  onMaxPriceChange: (value: number | undefined) => void;
}

export function PriceRangeFilter({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: PriceRangeFilterProps) {
  const [localMin, setLocalMin] = useState(minPrice?.toString() || '');
  const [localMax, setLocalMax] = useState(maxPrice?.toString() || '');

  // Sync local state with props
  useEffect(() => {
    setLocalMin(minPrice?.toString() || '');
  }, [minPrice]);

  useEffect(() => {
    setLocalMax(maxPrice?.toString() || '');
  }, [maxPrice]);

  // Debounced update for min price
  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalMin(value);
    },
    []
  );

  const handleMinBlur = useCallback(() => {
    const num = localMin ? Number(localMin) : undefined;
    if (num !== minPrice) {
      onMinPriceChange(num && !isNaN(num) ? num : undefined);
    }
  }, [localMin, minPrice, onMinPriceChange]);

  // Debounced update for max price
  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalMax(value);
    },
    []
  );

  const handleMaxBlur = useCallback(() => {
    const num = localMax ? Number(localMax) : undefined;
    if (num !== maxPrice) {
      onMaxPriceChange(num && !isNaN(num) ? num : undefined);
    }
  }, [localMax, maxPrice, onMaxPriceChange]);

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent, type: 'min' | 'max') => {
    if (e.key === 'Enter') {
      if (type === 'min') {
        handleMinBlur();
      } else {
        handleMaxBlur();
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label htmlFor="min-price" className="sr-only">
            Minimum Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              id="min-price"
              type="number"
              placeholder="Min"
              value={localMin}
              onChange={handleMinChange}
              onBlur={handleMinBlur}
              onKeyDown={(e) => handleKeyDown(e, 'min')}
              className="pl-7"
              min={0}
            />
          </div>
        </div>
        <span className="text-muted-foreground">-</span>
        <div className="flex-1">
          <label htmlFor="max-price" className="sr-only">
            Maximum Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              id="max-price"
              type="number"
              placeholder="Max"
              value={localMax}
              onChange={handleMaxChange}
              onBlur={handleMaxBlur}
              onKeyDown={(e) => handleKeyDown(e, 'max')}
              className="pl-7"
              min={0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
