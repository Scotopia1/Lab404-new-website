"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Tag, Check, Percent, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { usePromoCodes, PromoCode } from "@/hooks/use-promo-codes";
import { formatCurrency } from "@/lib/utils";

interface PromoCodeSelectorProps {
  value: string | undefined;
  onChange: (code: string | undefined) => void;
  label?: string;
}

export function PromoCodeSelector({
  value,
  onChange,
  label = "Promo Code",
}: PromoCodeSelectorProps) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: promoCodes, isLoading } = usePromoCodes();

  // Filter active and valid promo codes
  const availableCodes = useMemo(() => {
    if (!promoCodes) return [];

    const now = new Date();

    return promoCodes.filter((code) => {
      // Must be active
      if (!code.isActive) return false;

      // Check validity dates
      if (code.validFrom && new Date(code.validFrom) > now) return false;
      if (code.validTo && new Date(code.validTo) < now) return false;

      // Check usage limit
      if (code.maxUses && code.usedCount >= code.maxUses) return false;

      return true;
    });
  }, [promoCodes]);

  // Filter by search term
  const filteredCodes = useMemo(() => {
    if (!search.trim()) return availableCodes;

    const searchLower = search.toLowerCase();
    return availableCodes.filter(
      (code) =>
        code.code.toLowerCase().includes(searchLower) ||
        (code.description && code.description.toLowerCase().includes(searchLower))
    );
  }, [availableCodes, search]);

  // Find selected promo code details
  const selectedCode = useMemo(() => {
    if (!value || !promoCodes) return null;
    return promoCodes.find((code) => code.code === value) || null;
  }, [value, promoCodes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: PromoCode) => {
    onChange(code.code);
    setSearch("");
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setSearch("");
  };

  const formatDiscount = (code: PromoCode) => {
    if (code.discountType === "percentage") {
      return `${code.discountValue}% off`;
    }
    return `${formatCurrency(code.discountValue)} off`;
  };

  const formatValidity = (code: PromoCode) => {
    if (code.validTo) {
      const expiresAt = new Date(code.validTo);
      const now = new Date();
      const daysLeft = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft <= 0) return "Expired";
      if (daysLeft === 1) return "Expires today";
      if (daysLeft <= 7) return `${daysLeft} days left`;
      return `Until ${expiresAt.toLocaleDateString()}`;
    }
    return "No expiry";
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {selectedCode ? (
        // Show selected promo code
        <div className="p-3 border rounded-lg bg-muted/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span className="font-mono font-semibold">{selectedCode.code}</span>
              <Badge variant="secondary" className="text-xs">
                {selectedCode.discountType === "percentage" ? (
                  <Percent className="h-3 w-3 mr-1" />
                ) : (
                  <DollarSign className="h-3 w-3 mr-1" />
                )}
                {formatDiscount(selectedCode)}
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {selectedCode.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedCode.description}
            </p>
          )}
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>{formatValidity(selectedCode)}</span>
            {selectedCode.minimumOrderAmount && (
              <span>Min: {formatCurrency(selectedCode.minimumOrderAmount)}</span>
            )}
            {selectedCode.maxUses && (
              <span>
                Used: {selectedCode.usedCount}/{selectedCode.maxUses}
              </span>
            )}
          </div>
        </div>
      ) : (
        // Show search input
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search promo codes..."
              className="pl-10"
            />
          </div>

          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-72 overflow-auto">
              {isLoading ? (
                <div className="px-4 py-3 text-muted-foreground text-sm">
                  Loading promo codes...
                </div>
              ) : filteredCodes.length > 0 ? (
                filteredCodes.map((code) => (
                  <button
                    key={code.id}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-muted border-b last:border-b-0"
                    onClick={() => handleSelect(code)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">
                          {code.code}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {code.discountType === "percentage" ? (
                            <Percent className="h-3 w-3 mr-1" />
                          ) : (
                            <DollarSign className="h-3 w-3 mr-1" />
                          )}
                          {formatDiscount(code)}
                        </Badge>
                      </div>
                      {value === code.code && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {code.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {code.description}
                      </p>
                    )}
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{formatValidity(code)}</span>
                      {code.minimumOrderAmount && (
                        <span>Min: {formatCurrency(code.minimumOrderAmount)}</span>
                      )}
                      {code.maxUses && (
                        <span>
                          {code.maxUses - code.usedCount} uses left
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-muted-foreground text-sm">
                  {search
                    ? "No promo codes found matching your search"
                    : "No active promo codes available"}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
