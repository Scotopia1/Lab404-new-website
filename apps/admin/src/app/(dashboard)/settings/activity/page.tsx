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
  user: User,
};

const actionColors: Record<string, "default" | "success" | "destructive" | "warning" | "info"> = {
  create: "success",
  update: "info",
  delete: "destructive",
  login: "default",
  logout: "secondary" as "default",
  publish: "success",
  unpublish: "warning",
};

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useActivityLogs({ page, limit });

  // Mock data for demonstration
  const mockLogs: ActivityLog[] = [
    {
      id: "1",
      action: "create",
      entity: "product",
      entityId: "prod-1",
      adminId: "admin-1",
      admin: { email: "admin@lab404.com", firstName: "John", lastName: "Doe" },
      details: { productName: "Arduino Uno R3" },
      ipAddress: "192.168.1.1",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      action: "update",
      entity: "order",
      entityId: "ord-1",
      adminId: "admin-1",
      admin: { email: "admin@lab404.com", firstName: "John", lastName: "Doe" },
      details: { orderNumber: "ORD-10001", status: "shipped" },
      ipAddress: "192.168.1.1",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "3",
      action: "delete",
      entity: "promo_code",
      entityId: "promo-1",
      adminId: "admin-2",
      admin: { email: "manager@lab404.com", firstName: "Jane", lastName: "Smith" },
      details: { code: "SUMMER20" },
      ipAddress: "192.168.1.2",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "4",
      action: "publish",
      entity: "blog",
      entityId: "blog-1",
      adminId: "admin-1",
      admin: { email: "admin@lab404.com", firstName: "John", lastName: "Doe" },
      details: { title: "Getting Started with Arduino" },
      ipAddress: "192.168.1.1",
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: "5",
      action: "login",
      entity: "user",
      entityId: "admin-1",
      adminId: "admin-1",
      admin: { email: "admin@lab404.com", firstName: "John", lastName: "Doe" },
      details: null,
      ipAddress: "192.168.1.1",
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: "6",
      action: "update",
      entity: "setting",
      entityId: "tax-rate",
      adminId: "admin-2",
      admin: { email: "manager@lab404.com", firstName: "Jane", lastName: "Smith" },
      details: { key: "taxRate", oldValue: 8, newValue: 10 },
      ipAddress: "192.168.1.2",
      createdAt: new Date(Date.now() - 18000000).toISOString(),
    },
    {
      id: "7",
      action: "create",
      entity: "category",
      entityId: "cat-1",
      adminId: "admin-1",
      admin: { email: "admin@lab404.com", firstName: "John", lastName: "Doe" },
      details: { name: "Sensors" },
      ipAddress: "192.168.1.1",
      createdAt: new Date(Date.now() - 21600000).toISOString(),
    },
    {
      id: "8",
      action: "update",
      entity: "customer",
      entityId: "cust-1",
      adminId: "admin-2",
      admin: { email: "manager@lab404.com", firstName: "Jane", lastName: "Smith" },
      details: { customer: "customer@example.com", field: "isActive", value: false },
      ipAddress: "192.168.1.2",
      createdAt: new Date(Date.now() - 25200000).toISOString(),
    },
  ];

  const logs = data?.data || mockLogs;

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
      accessorKey: "entity",
      header: "Entity",
      cell: ({ row }) => {
        const Icon = entityIcons[row.original.entity] || Activity;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{row.original.entity.replace("_", " ")}</span>
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
            total: mockLogs.length,
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
