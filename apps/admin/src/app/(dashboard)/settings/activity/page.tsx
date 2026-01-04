"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  User,
  Package,
  ShoppingCart,
  Settings,
  FileText,
  Tag,
  Users,
  Ticket,
} from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useActivityLogs, ActivityLog } from "@/hooks/use-settings";
import { formatDateTime } from "@/lib/utils";

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  product: Package,
  order: ShoppingCart,
  customer: Users,
  category: Tag,
  blog: FileText,
  promo_code: Ticket,
  setting: Settings,
  settings: Settings,
  user: User,
};

const actionColors: Record<string, "default" | "success" | "destructive" | "warning" | "info"> = {
  create: "success",
  update: "info",
  delete: "destructive",
  login: "default",
  logout: "default",
  publish: "success",
  unpublish: "warning",
  bulk_update: "info",
  reset: "warning",
};

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useActivityLogs({ page, limit });

  const logs = data?.data || [];

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: "createdAt",
      header: "Time",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "admin",
      header: "Admin",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium text-sm">
              {row.original.admin?.firstName} {row.original.admin?.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.admin?.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Badge variant={actionColors[row.original.action] || "default"}>
          {row.original.action}
        </Badge>
      ),
    },
    {
      accessorKey: "entityType",
      header: "Entity",
      cell: ({ row }) => {
        const Icon = entityIcons[row.original.entityType] || Activity;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{row.original.entityType.replace("_", " ")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => {
        const details = row.original.details as Record<string, unknown> | null;
        if (!details) return <span className="text-muted-foreground">—</span>;

        // Format details based on entity type
        if (details.productName) return <span>{details.productName as string}</span>;
        if (details.orderNumber)
          return (
            <span>
              {details.orderNumber as string} → {details.status as string}
            </span>
          );
        if (details.code) return <span className="font-mono">{details.code as string}</span>;
        if (details.title) return <span>{details.title as string}</span>;
        if (details.name) return <span>{details.name as string}</span>;
        if (details.key)
          return (
            <span>
              {details.key as string}: {String(details.oldValue)} → {String(details.newValue)}
            </span>
          );
        if (details.updatedKeys)
          return (
            <span>
              Updated: {(details.updatedKeys as string[]).slice(0, 3).join(", ")}
              {(details.updatedKeys as string[]).length > 3 && "..."}
            </span>
          );
        if (details.resetKeys)
          return (
            <span>
              Reset: {details.resetKeys === "all" ? "All settings" : (details.resetKeys as string[]).join(", ")}
            </span>
          );
        if (details.customer)
          return (
            <span>
              {details.customer as string} ({details.field as string})
            </span>
          );

        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.ipAddress || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground">
          View recent admin actions and system events
        </p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchKey="action"
        searchPlaceholder="Search actions..."
        isLoading={isLoading}
        pagination={
          data?.meta || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
          }
        }
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />
    </div>
  );
}
