"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProductVariants,
  ProductVariant,
  formatVariantOptions,
} from "@/hooks/use-product-variants";
import { Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  onSelect: (variant: ProductVariant) => void;
  onSkip?: () => void; // Called when user wants to add base product without variant
}

export function VariantSelector({
  open,
  onOpenChange,
  productId,
  productName,
  onSelect,
  onSkip,
}: VariantSelectorProps) {
  const { data: variants, isLoading, error } = useProductVariants(productId);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Auto-skip if no variants (and we're done loading)
  useEffect(() => {
    if (!isLoading && !error && variants?.length === 0 && onSkip) {
      onSkip();
      onOpenChange(false);
    }
  }, [isLoading, error, variants, onSkip, onOpenChange]);

  const handleConfirm = () => {
    const variant = variants?.find((v) => v.id === selectedVariantId);
    if (variant) {
      onSelect(variant);
      onOpenChange(false);
      setSelectedVariantId(null);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedVariantId(null);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    onOpenChange(false);
    setSelectedVariantId(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Don't show dialog while loading or if auto-skipping
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Loading Variants</DialogTitle>
            <DialogDescription>
              Checking for variants of {productName}...
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No variants - show simple message with option to add base product
  if (!variants || variants.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Variants Available</DialogTitle>
            <DialogDescription>
              {productName} has no variants configured.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Would you like to add the base product to the quotation?
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSkip}>Add Base Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show variant selection
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Variant</DialogTitle>
          <DialogDescription>
            Choose a variant for {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-y-auto space-y-2 py-4">
          {error ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              Failed to load variants
            </div>
          ) : (
            variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantId(variant.id)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-colors",
                  selectedVariantId === variant.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{variant.name}</span>
                      {selectedVariantId === variant.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatVariantOptions(variant.options)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium">
                        {formatCurrency(variant.basePrice)}
                      </span>
                      {variant.stockQuantity <= 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          Out of stock
                        </Badge>
                      ) : variant.stockQuantity < 10 ? (
                        <Badge variant="secondary" className="text-xs">
                          {variant.stockQuantity} left
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {variant.imageUrl && (
                    <img
                      src={variant.imageUrl}
                      alt={variant.name}
                      className="h-12 w-12 rounded object-cover flex-shrink-0"
                    />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onSkip && (
            <Button variant="ghost" onClick={handleSkip} className="sm:mr-auto">
              Use Base Product
            </Button>
          )}
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedVariantId}>
            Add Selected Variant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
