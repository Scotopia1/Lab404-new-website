'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className="peer sr-only"
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            'h-4 w-4 shrink-0 rounded border border-input ring-offset-background',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'peer-checked:bg-primary peer-checked:border-primary peer-checked:text-primary-foreground',
            'flex items-center justify-center',
            className
          )}
        >
          <Check className="h-3 w-3 opacity-0 peer-checked:opacity-100 text-primary-foreground hidden peer-checked:block" />
        </div>
        <Check className="absolute h-3 w-3 text-primary-foreground pointer-events-none left-0.5 top-0.5 opacity-0 peer-checked:opacity-100" />
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
