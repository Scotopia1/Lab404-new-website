"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  Copy,
  Download,
  CheckSquare,
} from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  useDuplicateQuotation,
  useBulkQuotationAction,
  useCheckExpiredQuotations,
  Quotation,
} from "@/hooks/use-quotations";
import { QuotationStatsCards } from "@/components/quotations/stats-cards";
import { useRouter } from "next/navigation";
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

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"delete" | "send" | null>(null);

  const { data, isLoading } = useQuotations({
    page,
    limit,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const router = useRouter();
  const deleteQuotation = useDeleteQuotation();
  const sendQuotation = useSendQuotation();
  const convertQuotation = useConvertQuotation();
  const duplicateQuotation = useDuplicateQuotation();
  const bulkQuotationAction = useBulkQuotationAction();
  const checkExpiredQuotations = useCheckExpiredQuotations();

  // Check for expired quotations on page load (only once per session)
  const hasCheckedExpired = useRef(false);
  useEffect(() => {
    if (!hasCheckedExpired.current) {
      hasCheckedExpired.current = true;
      checkExpiredQuotations.mutate();
    }
  }, []);

  // Toggle selection for a single row
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle all rows on current page
  const toggleAllOnPage = () => {
    const currentIds = data?.data?.map((q) => q.id) || [];
    const allSelected = currentIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      // Deselect all on current page
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        currentIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all on current page
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        currentIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  // Check if all on page are selected
  const allOnPageSelected = useMemo(() => {
    const currentIds = data?.data?.map((q) => q.id) || [];
    return currentIds.length > 0 && currentIds.every((id) => selectedIds.has(id));
  }, [data?.data, selectedIds]);

  // Handle bulk action
  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;

    await bulkQuotationAction.mutateAsync({
      action: bulkAction,
      ids: Array.from(selectedIds),
    });

    setSelectedIds(new Set());
    setBulkAction(null);
  };

  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  };

  const handleDuplicate = async (id: string) => {
    const result = await duplicateQuotation.mutateAsync(id);
    router.push(`/quotations/${result.id}/edit`);
  };

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
      id: "select",
      header: () => (
        <Checkbox
          checked={allOnPageSelected}
          onCheckedChange={toggleAllOnPage}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleSelection(row.original.id)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
      cell: ({ row }) => {
        // Show linked customer if exists, otherwise show standalone fields
        if (row.original.customer) {
          return (
            <div>
              <div className="font-medium">
                {row.original.customer.firstName} {row.original.customer.lastName}
              </div>
              <div className="text-sm text-muted-foreground">
                {row.original.customer.email}
              </div>
            </div>
          );
        }
        // Fallback to standalone customer fields
        if (row.original.customerName || row.original.customerEmail) {
          return (
            <div>
              <div className="font-medium">{row.original.customerName}</div>
              <div className="text-sm text-muted-foreground">
                {row.original.customerEmail}
              </div>
            </div>
          );
        }
        return <span className="text-muted-foreground">—</span>;
      },
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
              onClick={() => handleDuplicate(row.original.id)}
              disabled={duplicateQuotation.isPending}
            >
              <Copy className="mr-2 h-4 w-4" />
              {duplicateQuotation.isPending ? "Duplicating..." : "Duplicate"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`${getApiBaseUrl()}/quotations/${row.original.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </DropdownMenuItem>
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

      <QuotationStatsCards />

      <div className="flex items-center justify-between">
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

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <div className="h-4 w-px bg-border mx-2" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setBulkAction("send")}>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Customers
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setBulkAction("delete")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
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

      {/* Bulk Action Dialog */}
      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "delete"
                ? "Delete Selected Quotations"
                : "Send Selected Quotations"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "delete" ? (
                <>
                  Are you sure you want to delete {selectedIds.size} quotation(s)?
                  This action cannot be undone.
                </>
              ) : (
                <>
                  This will send {selectedIds.size} quotation(s) to their
                  respective customers. Only draft quotations will be processed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              className={
                bulkAction === "delete"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : ""
              }
              disabled={bulkQuotationAction.isPending}
            >
              {bulkQuotationAction.isPending
                ? "Processing..."
                : bulkAction === "delete"
                  ? "Delete All"
                  : "Send All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
