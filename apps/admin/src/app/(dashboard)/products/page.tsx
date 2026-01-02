"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Download,
  Archive,
  CheckCircle,
} from "lucide-react";
import { DataTable, BulkAction } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
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
import { ProductStatusBadge } from "@/components/shared/status-badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useProducts, useDeleteProduct, Product } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<{
    ids: string[];
    status: string;
  } | null>(null);

  const { data, isLoading } = useProducts({ page, limit });
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(bulkDeleteIds.map((id) => deleteProduct.mutateAsync(id)));
      toast.success(`${bulkDeleteIds.length} products deleted`);
      setBulkDeleteIds([]);
    } catch {
      toast.error("Failed to delete some products");
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatusUpdate) return;
    try {
      await Promise.all(
        bulkStatusUpdate.ids.map((id) =>
          api.patch(`/products/${id}`, { status: bulkStatusUpdate.status })
        )
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        `${bulkStatusUpdate.ids.length} products updated to ${bulkStatusUpdate.status}`
      );
      setBulkStatusUpdate(null);
    } catch {
      toast.error("Failed to update some products");
    }
  };

  const handleBulkExport = (products: Product[]) => {
    const csv = [
      ["ID", "Name", "SKU", "Price", "Stock", "Status", "Category"].join(","),
      ...products.map((p) =>
        [
          p.id,
          `"${p.name.replace(/"/g, '""')}"`,
          p.sku || "",
          p.basePrice,
          p.stockQuantity,
          p.status,
          p.category?.name || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-export-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${products.length} products exported`);
  };

  const bulkActions: BulkAction<Product>[] = [
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      onClick: (products) => setBulkDeleteIds(products.map((p) => p.id)),
    },
    {
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      onClick: handleBulkExport,
    },
    {
      label: "Publish",
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: (products) =>
        setBulkStatusUpdate({ ids: products.map((p) => p.id), status: "active" }),
    },
    {
      label: "Unpublish",
      icon: <Archive className="h-4 w-4" />,
      onClick: (products) =>
        setBulkStatusUpdate({ ids: products.map((p) => p.id), status: "draft" }),
    },
  ];

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.images?.[0] ? (
            <img
              src={row.original.images[0].url}
              alt={row.original.name}
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
              No img
            </div>
          )}
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.sku || "No SKU"}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "basePrice",
      header: "Price",
      cell: ({ row }) => formatCurrency(row.original.basePrice),
    },
    {
      accessorKey: "stockQuantity",
      header: "Stock",
      cell: ({ row }) => {
        const qty = row.original.stockQuantity;
        const low = row.original.lowStockThreshold;
        return (
          <span className={qty <= low ? "text-destructive font-medium" : ""}>
            {qty}
          </span>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category?.name || "—",
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
              <Link href={`/products/${row.original.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`/products/${row.original.slug}`}
                target="_blank"
                rel="noopener"
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </a>
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

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchKey="name"
        searchPlaceholder="Search products..."
        isLoading={isLoading}
        pagination={data?.meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        enableSelection
        bulkActions={bulkActions}
        getRowId={(row) => row.id}
      />

      {/* Single Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be
              undone.
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

      {/* Bulk Delete Dialog */}
      <AlertDialog
        open={bulkDeleteIds.length > 0}
        onOpenChange={() => setBulkDeleteIds([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bulkDeleteIds.length} Products</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {bulkDeleteIds.length} products? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Update Dialog */}
      <AlertDialog
        open={!!bulkStatusUpdate}
        onOpenChange={() => setBulkStatusUpdate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkStatusUpdate?.status === "active" ? "Publish" : "Unpublish"}{" "}
              {bulkStatusUpdate?.ids.length} Products
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {bulkStatusUpdate?.status === "active" ? "publish" : "unpublish"}{" "}
              {bulkStatusUpdate?.ids.length} products?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkStatusUpdate}>
              {bulkStatusUpdate?.status === "active" ? "Publish" : "Unpublish"} All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
