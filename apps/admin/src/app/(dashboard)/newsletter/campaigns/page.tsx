"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Play,
  Pause,
  X,
  Eye,
  Pencil,
  Trash2,
  Send,
  Mail,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useNewsletterCampaigns,
  useDeleteCampaign,
  useStartCampaign,
  usePauseCampaign,
  useCancelCampaign,
  NewsletterCampaign,
} from "@/hooks/use-newsletter";
import { formatDate } from "@/lib/utils";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive"; icon: React.ReactNode }
> = {
  draft: { label: "Draft", variant: "secondary", icon: <Pencil className="h-3 w-3" /> },
  scheduled: { label: "Scheduled", variant: "default", icon: <Clock className="h-3 w-3" /> },
  sending: { label: "Sending", variant: "warning", icon: <Send className="h-3 w-3" /> },
  paused: { label: "Paused", variant: "secondary", icon: <Pause className="h-3 w-3" /> },
  completed: { label: "Completed", variant: "success", icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", variant: "destructive", icon: <X className="h-3 w-3" /> },
};

export default function CampaignsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionCampaign, setActionCampaign] = useState<{
    id: string;
    action: "start" | "pause" | "cancel";
    name: string;
  } | null>(null);

  const { data, isLoading } = useNewsletterCampaigns({ page, limit });
  const deleteCampaign = useDeleteCampaign();
  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();
  const cancelCampaign = useCancelCampaign();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCampaign.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleAction = async () => {
    if (!actionCampaign) return;

    switch (actionCampaign.action) {
      case "start":
        await startCampaign.mutateAsync(actionCampaign.id);
        break;
      case "pause":
        await pauseCampaign.mutateAsync(actionCampaign.id);
        break;
      case "cancel":
        await cancelCampaign.mutateAsync(actionCampaign.id);
        break;
    }
    setActionCampaign(null);
  };

  // Calculate stats from campaigns
  const campaigns = data?.data || [];
  const activeCampaigns = campaigns.filter((c) => c.status === "sending").length;
  const completedCampaigns = campaigns.filter((c) => c.status === "completed").length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);

  const columns: ColumnDef<NewsletterCampaign>[] = [
    {
      accessorKey: "name",
      header: "Campaign",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
            {row.original.subject}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return (
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const { sentCount, totalRecipients, failedCount, dailyLimit } = row.original;
        const progress = totalRecipients > 0 ? (sentCount / totalRecipients) * 100 : 0;

        return (
          <div className="space-y-1 min-w-[150px]">
            <div className="flex justify-between text-xs">
              <span>
                {sentCount} / {totalRecipients}
              </span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {failedCount > 0 && <span className="text-destructive">{failedCount} failed</span>}
              <span>{dailyLimit}/day limit</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const campaign = row.original;
        const canStart = ["draft", "scheduled", "paused"].includes(campaign.status);
        const canPause = campaign.status === "sending";
        const canCancel = ["scheduled", "sending", "paused"].includes(campaign.status);
        const canDelete = campaign.status === "draft";
        const canEdit = ["draft", "scheduled", "paused"].includes(campaign.status);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/newsletter/campaigns/${campaign.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/newsletter/campaigns/${campaign.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canStart && (
                <DropdownMenuItem
                  onClick={() =>
                    setActionCampaign({ id: campaign.id, action: "start", name: campaign.name })
                  }
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Sending
                </DropdownMenuItem>
              )}
              {canPause && (
                <DropdownMenuItem
                  onClick={() =>
                    setActionCampaign({ id: campaign.id, action: "pause", name: campaign.name })
                  }
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </DropdownMenuItem>
              )}
              {canCancel && (
                <DropdownMenuItem
                  onClick={() =>
                    setActionCampaign({ id: campaign.id, action: "cancel", name: campaign.name })
                  }
                  className="text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteId(campaign.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground">Create and manage newsletter campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/newsletter">
              <Users className="mr-2 h-4 w-4" />
              Subscribers
            </Link>
          </Button>
          <Button asChild>
            <Link href="/newsletter/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Send className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{activeCampaigns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCampaigns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalSent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={campaigns}
        searchKey="name"
        searchPlaceholder="Search campaigns..."
        isLoading={isLoading}
        pagination={data?.meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        getRowId={(row) => row.id}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft campaign? This action cannot be undone.
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

      {/* Action Confirmation */}
      <AlertDialog open={!!actionCampaign} onOpenChange={() => setActionCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionCampaign?.action === "start" && "Start Campaign"}
              {actionCampaign?.action === "pause" && "Pause Campaign"}
              {actionCampaign?.action === "cancel" && "Cancel Campaign"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionCampaign?.action === "start" && (
                <>
                  Start sending "{actionCampaign.name}"? Emails will be sent according to the daily
                  limit. The cron job runs every hour to process the queue.
                </>
              )}
              {actionCampaign?.action === "pause" && (
                <>
                  Pause "{actionCampaign.name}"? No more emails will be sent until you resume.
                </>
              )}
              {actionCampaign?.action === "cancel" && (
                <>
                  Cancel "{actionCampaign.name}"? All pending emails will be discarded. Emails
                  already sent cannot be recalled.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionCampaign?.action === "cancel" ? "bg-destructive text-white hover:bg-destructive/90" : ""}
            >
              {actionCampaign?.action === "start" && "Start Sending"}
              {actionCampaign?.action === "pause" && "Pause"}
              {actionCampaign?.action === "cancel" && "Cancel Campaign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
