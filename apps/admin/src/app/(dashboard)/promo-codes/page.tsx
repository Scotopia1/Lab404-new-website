"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Package,
  FolderTree,
} from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  usePromoCodes,
  useDeletePromoCode,
  PromoCode,
} from "@/hooks/use-promo-codes";
import { formatCurrency, formatDate } from "@/lib/utils";

function getPromoStatus(promo: PromoCode): {
  label: string;
  variant: "success" | "secondary" | "warning" | "destructive";
  tooltip?: string;
} {
  const now = new Date();

  if (!promo.isActive) {
    return { label: "Inactive", variant: "secondary" };
  }

  if (promo.validTo && new Date(promo.validTo) < now) {
    return {
      label: "Expired",
      variant: "destructive",
      tooltip: `Expired on ${formatDate(promo.validTo)}`,
    };
  }

  if (promo.validFrom && new Date(promo.validFrom) > now) {
    return {
      label: "Scheduled",
      variant: "warning",
      tooltip: `Starts on ${formatDate(promo.validFrom)}`,
    };
  }

  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    return {
      label: "Exhausted",
      variant: "destructive",
      tooltip: "Usage limit reached",
    };
  }

  return { label: "Active", variant: "success" };
}

export default function PromoCodesPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: promoCodes, isLoading } = usePromoCodes();
  const deletePromo = useDeletePromoCode();

  const handleDelete = async () => {
    if (deleteId) {
      await deletePromo.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<PromoCode>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="min-w-[120px]">
          <Link
            href={`/promo-codes/${row.original.id}/edit`}
            className="font-mono font-semibold text-primary hover:underline"
          >
            {row.original.code}
          </Link>
          {row.original.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "discountType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal">
          {row.original.discountType === "percentage" ? (
            <Percent className="h-3 w-3 mr-1" />
          ) : (
            <DollarSign className="h-3 w-3 mr-1" />
          )}
          {row.original.discountType === "percentage" ? "Percent" : "Fixed"}
        </Badge>
      ),
    },
    {
      accessorKey: "discountValue",
      header: "Discount",
      cell: ({ row }) => {
        const { discountType, discountValue, maximumDiscountAmount } = row.original;

        return (
          <div className="font-medium">
            <span className="text-lg">
              {discountType === "percentage"
                ? `${discountValue}%`
                : formatCurrency(discountValue)}
            </span>
            {discountType === "percentage" && maximumDiscountAmount && maximumDiscountAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Max: {formatCurrency(maximumDiscountAmount)}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "minimumOrderAmount",
      header: "Min. Order",
      cell: ({ row }) => {
        const min = row.original.minimumOrderAmount;
        if (!min || min <= 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return <span>{formatCurrency(min)}</span>;
      },
    },
    {
      accessorKey: "usage",
      header: "Usage",
      cell: ({ row }) => {
        const { usedCount, maxUses, usageLimitPerCustomer } = row.original;
        const isNearLimit = maxUses && usedCount >= maxUses * 0.8;
        const isExhausted = maxUses && usedCount >= maxUses;

        return (
          <div>
            <div className="flex items-center gap-1">
              <span
                className={
                  isExhausted
                    ? "text-destructive font-medium"
                    : isNearLimit
                      ? "text-orange-500 font-medium"
                      : ""
                }
              >
                {usedCount}
              </span>
              <span className="text-muted-foreground">
                / {maxUses || "∞"}
              </span>
            </div>
            {usageLimitPerCustomer > 1 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {usageLimitPerCustomer}x per user
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "validity",
      header: "Valid Period",
      cell: ({ row }) => {
        const { validFrom, validTo } = row.original;
        const now = new Date();

        if (!validFrom && !validTo) {
          return <span className="text-muted-foreground">Always</span>;
        }

        const isExpired = validTo && new Date(validTo) < now;
        const isNotStarted = validFrom && new Date(validFrom) > now;

        return (
          <div className="text-sm">
            {validFrom && (
              <div className={isNotStarted ? "text-warning" : ""}>
                <span className="text-muted-foreground">From: </span>
                {formatDate(validFrom)}
              </div>
            )}
            {validTo && (
              <div className={isExpired ? "text-destructive" : ""}>
                <span className="text-muted-foreground">To: </span>
                {formatDate(validTo)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "restrictions",
      header: "Restrictions",
      cell: ({ row }) => {
        const { appliesToProducts, appliesToCategories } = row.original;
        const productCount = appliesToProducts?.length || 0;
        const categoryCount = appliesToCategories?.length || 0;

        if (productCount === 0 && categoryCount === 0) {
          return <span className="text-muted-foreground text-sm">All products</span>;
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  {productCount > 0 && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Package className="h-3 w-3" />
                      {productCount}
                    </Badge>
                  )}
                  {categoryCount > 0 && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <FolderTree className="h-3 w-3" />
                      {categoryCount}
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  {productCount > 0 && (
                    <div>{productCount} product{productCount > 1 ? "s" : ""}</div>
                  )}
                  {categoryCount > 0 && (
                    <div>{categoryCount} categor{categoryCount > 1 ? "ies" : "y"}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const status = getPromoStatus(row.original);

        if (status.tooltip) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={status.variant} className="cursor-help">
                    {status.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-xs">{status.tooltip}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/promo-codes/${row.original.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Calculate stats
  const stats = promoCodes
    ? {
        total: promoCodes.length,
        active: promoCodes.filter((p) => getPromoStatus(p).label === "Active").length,
        expired: promoCodes.filter((p) => getPromoStatus(p).label === "Expired").length,
        scheduled: promoCodes.filter((p) => getPromoStatus(p).label === "Scheduled").length,
      }
    : { total: 0, active: 0, expired: 0, scheduled: 0 };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promo Codes</h1>
          <p className="text-muted-foreground">
            Manage discount codes and promotions
          </p>
        </div>
        <Button asChild>
          <Link href="/promo-codes/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Promo Code
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Scheduled</div>
          <div className="text-2xl font-bold text-orange-500">{stats.scheduled}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Expired</div>
          <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={promoCodes || []}
        searchKey="code"
        searchPlaceholder="Search promo codes..."
        isLoading={isLoading}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promo code? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
