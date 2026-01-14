"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Download,
  Trash2,
  Plus,
  Users,
  UserPlus,
  UserMinus,
  Mail,
  Upload,
} from "lucide-react";
import { DataTable, BulkAction } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useNewsletterSubscribers,
  useSubscriberStats,
  useAddSubscriber,
  useDeleteSubscriber,
  useBulkDeleteSubscribers,
  useImportSubscribers,
  NewsletterSubscriber,
} from "@/hooks/use-newsletter";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<string, "success" | "secondary" | "destructive"> = {
  active: "success",
  unsubscribed: "secondary",
  bounced: "destructive",
};

export default function NewsletterSubscribersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [importText, setImportText] = useState("");

  const { data, isLoading } = useNewsletterSubscribers({ page, limit });
  const { data: stats } = useSubscriberStats();
  const addSubscriber = useAddSubscriber();
  const deleteSubscriber = useDeleteSubscriber();
  const bulkDelete = useBulkDeleteSubscribers();
  const importSubscribers = useImportSubscribers();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSubscriber.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    await bulkDelete.mutateAsync(bulkDeleteIds);
    setBulkDeleteIds([]);
  };

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    await addSubscriber.mutateAsync({ email: newEmail, name: newName || undefined });
    setNewEmail("");
    setNewName("");
    setShowAddDialog(false);
  };

  const handleImport = async () => {
    const lines = importText.split("\n").filter((line) => line.trim());
    const subscribers = lines.map((line) => {
      const [email, name] = line.split(",").map((s) => s.trim());
      return { email, name: name || undefined };
    });

    if (subscribers.length === 0) {
      toast.error("No valid subscribers found");
      return;
    }

    await importSubscribers.mutateAsync(subscribers);
    setImportText("");
    setShowImportDialog(false);
  };

  const handleExport = () => {
    window.open("/api/newsletter/subscribers/export", "_blank");
  };

  const handleBulkExport = (subscribers: NewsletterSubscriber[]) => {
    const csv = [
      ["Email", "Name", "Status", "Source", "Subscribed At"].join(","),
      ...subscribers.map((s) =>
        [
          s.email,
          `"${s.name || ""}"`,
          s.status,
          s.source,
          new Date(s.subscribedAt).toISOString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-export-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${subscribers.length} subscribers exported`);
  };

  const bulkActions: BulkAction<NewsletterSubscriber>[] = [
    {
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      onClick: handleBulkExport,
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      onClick: (subscribers) => setBulkDeleteIds(subscribers.map((s) => s.id)),
    },
  ];

  const columns: ColumnDef<NewsletterSubscriber>[] = [
    {
      accessorKey: "email",
      header: "Subscriber",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.email}</div>
          {row.original.name && (
            <div className="text-sm text-muted-foreground">{row.original.name}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusColors[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <span className="capitalize text-sm">{row.original.source}</span>
      ),
    },
    {
      accessorKey: "subscribedAt",
      header: "Subscribed",
      cell: ({ row }) => formatDate(row.original.subscribedAt),
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
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
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
          <h1 className="text-2xl font-bold text-foreground">Newsletter</h1>
          <p className="text-muted-foreground">
            Manage subscribers and send campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscriber
          </Button>
          <Button asChild>
            <Link href="/newsletter/campaigns">
              <Mail className="mr-2 h-4 w-4" />
              Campaigns
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unsubscribed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.thisMonth || 0}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchKey="email"
        searchPlaceholder="Search subscribers..."
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

      {/* Add Subscriber Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subscriber</DialogTitle>
            <DialogDescription>
              Add a new email subscriber to the newsletter list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!newEmail.trim() || addSubscriber.isPending}>
              Add Subscriber
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Subscribers</DialogTitle>
            <DialogDescription>
              Paste email addresses (one per line). Optionally add name after comma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder={`email@example.com, John Doe\nanother@example.com\nthird@example.com, Jane Smith`}
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Format: email@example.com, Name (name is optional)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importText.trim() || importSubscribers.isPending}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Subscriber</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this subscriber? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteIds.length > 0} onOpenChange={() => setBulkDeleteIds([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {bulkDeleteIds.length} Subscribers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {bulkDeleteIds.length} subscribers? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
