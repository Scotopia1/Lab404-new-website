"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  MoreHorizontal,
  UserX,
  UserCheck,
  Download,
  Mail,
} from "lucide-react";
import { DataTable, BulkAction } from "@/components/data-table/data-table";
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
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useCustomers,
  useDeactivateCustomer,
  Customer,
} from "@/hooks/use-customers";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [bulkDeactivateIds, setBulkDeactivateIds] = useState<string[]>([]);
  const [bulkActivateIds, setBulkActivateIds] = useState<string[]>([]);

  const { data, isLoading } = useCustomers({ page, limit });
  const deactivateCustomer = useDeactivateCustomer();
  const queryClient = useQueryClient();

  const handleDeactivate = async () => {
    if (deactivateId) {
      await deactivateCustomer.mutateAsync(deactivateId);
      setDeactivateId(null);
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await Promise.all(
        bulkDeactivateIds.map((id) => deactivateCustomer.mutateAsync(id))
      );
      toast.success(`${bulkDeactivateIds.length} customers deactivated`);
      setBulkDeactivateIds([]);
    } catch {
      toast.error("Failed to deactivate some customers");
    }
  };

  const handleBulkActivate = async () => {
    try {
      await Promise.all(
        bulkActivateIds.map((id) =>
          api.patch(`/customers/${id}`, { isActive: true })
        )
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(`${bulkActivateIds.length} customers activated`);
      setBulkActivateIds([]);
    } catch {
      toast.error("Failed to activate some customers");
    }
  };

  const handleBulkExport = (customers: Customer[]) => {
    const csv = [
      [
        "ID",
        "First Name",
        "Last Name",
        "Email",
        "Status",
        "Total Orders",
        "Total Spent",
        "Joined",
      ].join(","),
      ...customers.map((c) =>
        [
          c.id,
          `"${c.firstName}"`,
          `"${c.lastName}"`,
          c.email,
          c.isActive ? "Active" : "Inactive",
          c.totalOrders,
          c.totalSpent,
          new Date(c.createdAt).toISOString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-export-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${customers.length} customers exported`);
  };

  const handleCopyEmails = (customers: Customer[]) => {
    const emails = customers.map((c) => c.email).join(", ");
    navigator.clipboard.writeText(emails);
    toast.success(`${customers.length} email addresses copied to clipboard`);
  };

  const bulkActions: BulkAction<Customer>[] = [
    {
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      onClick: handleBulkExport,
    },
    {
      label: "Copy Emails",
      icon: <Mail className="h-4 w-4" />,
      onClick: handleCopyEmails,
    },
    {
      label: "Activate",
      icon: <UserCheck className="h-4 w-4" />,
      onClick: (customers) =>
        setBulkActivateIds(customers.filter((c) => !c.isActive).map((c) => c.id)),
    },
    {
      label: "Deactivate",
      icon: <UserX className="h-4 w-4" />,
      variant: "destructive",
      onClick: (customers) =>
        setBulkDeactivateIds(customers.filter((c) => c.isActive).map((c) => c.id)),
    },
  ];

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "email",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "totalOrders",
      header: "Orders",
      cell: ({ row }) => row.original.totalOrders,
    },
    {
      accessorKey: "totalSpent",
      header: "Total Spent",
      cell: ({ row }) => formatCurrency(row.original.totalSpent),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
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
              <Link href={`/customers/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            {row.original.isActive && (
              <DropdownMenuItem
                onClick={() => setDeactivateId(row.original.id)}
                className="text-destructive"
              >
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground">
          View and manage customer accounts
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchKey="email"
        searchPlaceholder="Search customers..."
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

      {/* Single Deactivate Dialog */}
      <AlertDialog
        open={!!deactivateId}
        onOpenChange={() => setDeactivateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this customer? They will no
              longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Deactivate Dialog */}
      <AlertDialog
        open={bulkDeactivateIds.length > 0}
        onOpenChange={() => setBulkDeactivateIds([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deactivate {bulkDeactivateIds.length} Customers
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {bulkDeactivateIds.length}{" "}
              customers? They will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeactivate}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Deactivate All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Activate Dialog */}
      <AlertDialog
        open={bulkActivateIds.length > 0}
        onOpenChange={() => setBulkActivateIds([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Activate {bulkActivateIds.length} Customers
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate {bulkActivateIds.length}{" "}
              customers?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkActivate}>
              Activate All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
