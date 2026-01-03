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
  Search,
  Plus,
  StickyNote,
  Loader2,
} from "lucide-react";
import { DataTable, BulkAction } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useOrders, useDebounce, useUpdateOrder, Order, OrderStatus, PaymentStatus } from "@/hooks/use-orders";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<{
    ids: string[];
    status: OrderStatus;
  } | null>(null);
  const [notesDialog, setNotesDialog] = useState<{
    orderId: string;
    orderNumber: string;
    notes: string;
  } | null>(null);

  const { data, isLoading } = useOrders({
    page,
    limit,
    status: status === "all" ? undefined : status,
    paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
    search: debouncedSearch || undefined,
  });

  const updateOrder = useUpdateOrder();
  const queryClient = useQueryClient();

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatusUpdate) return;
    try {
      await Promise.all(
        bulkStatusUpdate.ids.map((id) =>
          api.put(`/orders/${id}`, { status: bulkStatusUpdate.status })
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

  const handleSaveNotes = async () => {
    if (!notesDialog) return;
    await updateOrder.mutateAsync({
      id: notesDialog.orderId,
      data: { adminNotes: notesDialog.notes },
    });
    setNotesDialog(null);
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
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} />,
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setNotesDialog({
                orderId: row.original.id,
                orderNumber: row.original.orderNumber,
                notes: row.original.adminNotes || "",
              })
            }
            title="Quick Notes"
          >
            <StickyNote className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orders/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
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
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Link>
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, email, or order #..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-[300px] pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as OrderStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Order status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={paymentStatus}
            onValueChange={(v) => {
              setPaymentStatus(v as PaymentStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
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

      {/* Quick Notes Dialog */}
      <Dialog open={!!notesDialog} onOpenChange={() => setNotesDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes - Order #{notesDialog?.orderNumber}</DialogTitle>
            <DialogDescription>
              Add internal notes for this order. These notes are only visible to admins.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Notes</Label>
              <Textarea
                id="admin-notes"
                value={notesDialog?.notes || ""}
                onChange={(e) =>
                  setNotesDialog((prev) =>
                    prev ? { ...prev, notes: e.target.value } : null
                  )
                }
                placeholder="Enter admin notes..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateOrder.isPending}>
              {updateOrder.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
