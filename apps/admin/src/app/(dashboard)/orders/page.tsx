"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Download,
  Truck,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";
import { DataTable, BulkAction } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useOrders, Order, OrderStatus } from "@/hooks/use-orders";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<{
    ids: string[];
    status: OrderStatus;
  } | null>(null);

  const { data, isLoading } = useOrders({
    page,
    limit,
    status: status === "all" ? undefined : status,
  });

  const queryClient = useQueryClient();

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatusUpdate) return;
    try {
      await Promise.all(
        bulkStatusUpdate.ids.map((id) =>
          api.patch(`/orders/${id}/status`, { status: bulkStatusUpdate.status })
        )
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(
        `${bulkStatusUpdate.ids.length} orders updated to ${bulkStatusUpdate.status}`
      );
      setBulkStatusUpdate(null);
    } catch {
      toast.error("Failed to update some orders");
    }
  };

  const handleBulkExport = (orders: Order[]) => {
    const csv = [
      [
        "Order Number",
        "Customer",
        "Email",
        "Status",
        "Total",
        "Items",
        "Date",
      ].join(","),
      ...orders.map((o) =>
        [
          o.orderNumber,
          o.customer
            ? `"${o.customer.firstName} ${o.customer.lastName}"`
            : "Guest",
          o.customer?.email || "",
          o.status,
          o.total,
          o.items?.length || 0,
          new Date(o.createdAt).toISOString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-export-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${orders.length} orders exported`);
  };

  const bulkActions: BulkAction<Order>[] = [
    {
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      onClick: handleBulkExport,
    },
    {
      label: "Mark Processing",
      icon: <Package className="h-4 w-4" />,
      onClick: (orders) =>
        setBulkStatusUpdate({
          ids: orders.map((o) => o.id),
          status: "processing",
        }),
    },
    {
      label: "Mark Shipped",
      icon: <Truck className="h-4 w-4" />,
      onClick: (orders) =>
        setBulkStatusUpdate({
          ids: orders.map((o) => o.id),
          status: "shipped",
        }),
    },
    {
      label: "Mark Delivered",
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: (orders) =>
        setBulkStatusUpdate({
          ids: orders.map((o) => o.id),
          status: "delivered",
        }),
    },
    {
      label: "Cancel",
      icon: <XCircle className="h-4 w-4" />,
      variant: "destructive",
      onClick: (orders) =>
        setBulkStatusUpdate({
          ids: orders.map((o) => o.id),
          status: "cancelled",
        }),
    },
  ];

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => (
        <Link
          href={`/orders/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          #{row.original.orderNumber}
        </Link>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original.customer;
        return customer
          ? `${customer.firstName} ${customer.lastName}`
          : "Guest";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => formatCurrency(row.original.total),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/orders/${row.original.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">
            View and manage customer orders
          </p>
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as OrderStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchKey="orderNumber"
        searchPlaceholder="Search orders..."
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

      {/* Bulk Status Update Dialog */}
      <AlertDialog
        open={!!bulkStatusUpdate}
        onOpenChange={() => setBulkStatusUpdate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Update {bulkStatusUpdate?.ids.length} Orders to{" "}
              {bulkStatusUpdate?.status}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of{" "}
              {bulkStatusUpdate?.ids.length} orders to {bulkStatusUpdate?.status}
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusUpdate}
              className={
                bulkStatusUpdate?.status === "cancelled"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : ""
              }
            >
              Update All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
