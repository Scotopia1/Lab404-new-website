"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Send,
  ShoppingCart,
  Eye,
} from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useQuotations,
  useDeleteQuotation,
  useSendQuotation,
  useConvertQuotation,
  Quotation,
} from "@/hooks/use-quotations";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusConfig: Record<
  Quotation["status"],
  { label: string; variant: "default" | "secondary" | "success" | "destructive" | "warning" | "info" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "info" },
  accepted: { label: "Accepted", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "warning" },
  converted: { label: "Converted", variant: "default" },
};

export default function QuotationsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);

  const { data, isLoading } = useQuotations({
    page,
    limit,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const deleteQuotation = useDeleteQuotation();
  const sendQuotation = useSendQuotation();
  const convertQuotation = useConvertQuotation();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteQuotation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleConvert = async () => {
    if (convertId) {
      await convertQuotation.mutateAsync(convertId);
      setConvertId(null);
    }
  };

  const columns: ColumnDef<Quotation>[] = [
    {
      accessorKey: "quotationNumber",
      header: "Quotation #",
      cell: ({ row }) => (
        <span className="font-mono font-medium">
          {row.original.quotationNumber}
        </span>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) =>
        row.original.customer ? (
          <div>
            <div className="font-medium">
              {row.original.customer.firstName} {row.original.customer.lastName}
            </div>
            <div className="text-sm text-muted-foreground">
              {row.original.customer.email}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.total)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "validUntil",
      header: "Valid Until",
      cell: ({ row }) =>
        row.original.validUntil
          ? formatDate(row.original.validUntil)
          : "No expiry",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
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
              <Link href={`/quotations/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            {row.original.status === "draft" && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/quotations/${row.original.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => sendQuotation.mutate(row.original.id)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send to Customer
                </DropdownMenuItem>
              </>
            )}
            {row.original.status === "accepted" && (
              <DropdownMenuItem onClick={() => setConvertId(row.original.id)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Convert to Order
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
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
          <h1 className="text-2xl font-bold text-foreground">Quotations</h1>
          <p className="text-muted-foreground">
            Create and manage customer quotations
          </p>
        </div>
        <Button asChild>
          <Link href="/quotations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchKey="quotationNumber"
        searchPlaceholder="Search quotations..."
        isLoading={isLoading}
        pagination={data?.meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quotation? This action cannot
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

      <AlertDialog open={!!convertId} onOpenChange={() => setConvertId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new order based on this quotation. The quotation
              status will be changed to "Converted".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert}>
              Convert to Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
