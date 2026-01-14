"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  X,
  Pencil,
  Send,
  Eye,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Mail,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useNewsletterCampaign,
  useStartCampaign,
  usePauseCampaign,
  useCancelCampaign,
  useSendTestEmail,
} from "@/hooks/use-newsletter";
import { formatDate } from "@/lib/utils";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive"; icon: React.ReactNode }
> = {
  draft: { label: "Draft", variant: "secondary", icon: <Pencil className="h-4 w-4" /> },
  scheduled: { label: "Scheduled", variant: "default", icon: <Clock className="h-4 w-4" /> },
  sending: { label: "Sending", variant: "warning", icon: <Send className="h-4 w-4" /> },
  paused: { label: "Paused", variant: "secondary", icon: <Pause className="h-4 w-4" /> },
  completed: { label: "Completed", variant: "success", icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: "Cancelled", variant: "destructive", icon: <X className="h-4 w-4" /> },
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [actionType, setActionType] = useState<"start" | "pause" | "cancel" | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { data: campaign, isLoading } = useNewsletterCampaign(id);
  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();
  const cancelCampaign = useCancelCampaign();
  const sendTestEmailMutation = useSendTestEmail();

  const handleAction = async () => {
    if (!actionType) return;

    switch (actionType) {
      case "start":
        await startCampaign.mutateAsync(id);
        break;
      case "pause":
        await pauseCampaign.mutateAsync(id);
        break;
      case "cancel":
        await cancelCampaign.mutateAsync(id);
        break;
    }
    setActionType(null);
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) return;
    await sendTestEmailMutation.mutateAsync({ campaignId: id, email: testEmail });
    setShowTestDialog(false);
    setTestEmail("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Campaign not found</p>
            <Button asChild className="mt-4">
              <Link href="/newsletter/campaigns">Back to Campaigns</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = statusConfig[campaign.status];
  const progress = campaign.totalRecipients > 0 ? (campaign.sentCount / campaign.totalRecipients) * 100 : 0;
  const canStart = ["draft", "scheduled", "paused"].includes(campaign.status);
  const canPause = campaign.status === "sending";
  const canCancel = ["scheduled", "sending", "paused"].includes(campaign.status);
  const canEdit = ["draft", "scheduled", "paused"].includes(campaign.status);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/newsletter/campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
              <Badge variant={config.variant} className="gap-1">
                {config.icon}
                {config.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">Subject: {campaign.subject}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTestDialog(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Send Test
          </Button>
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/newsletter/campaigns/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {canStart && (
            <Button onClick={() => setActionType("start")}>
              <Play className="mr-2 h-4 w-4" />
              Start Sending
            </Button>
          )}
          {canPause && (
            <Button variant="secondary" onClick={() => setActionType("pause")}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={() => setActionType("cancel")}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sending Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {campaign.sentCount.toLocaleString()} / {campaign.totalRecipients.toLocaleString()} emails sent
                  </span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{campaign.sentCount}</div>
                  <div className="text-sm text-muted-foreground">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{campaign.failedCount}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {campaign.totalRecipients - campaign.sentCount - campaign.failedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>Preview of the email content</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Full Preview
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg bg-white overflow-hidden">
                <iframe
                  srcDoc={campaign.content}
                  className="w-full h-[300px] border-0"
                  title="Email preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Daily Limit</div>
                <div className="font-medium">{campaign.dailyLimit} emails/day</div>
              </div>
              {campaign.sendTime && (
                <div>
                  <div className="text-sm text-muted-foreground">Send Time</div>
                  <div className="font-medium">{campaign.sendTime}</div>
                </div>
              )}
              {campaign.previewText && (
                <div>
                  <div className="text-sm text-muted-foreground">Preview Text</div>
                  <div className="font-medium">{campaign.previewText}</div>
                </div>
              )}
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">{formatDate(campaign.createdAt)}</div>
              </div>
              {campaign.startedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Started</div>
                  <div className="font-medium">{formatDate(campaign.startedAt)}</div>
                </div>
              )}
              {campaign.lastSentAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Last Sent</div>
                  <div className="font-medium">{formatDate(campaign.lastSentAt)}</div>
                </div>
              )}
              {campaign.completedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                  <div className="font-medium">{formatDate(campaign.completedAt)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estimated Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {campaign.status === "completed"
                    ? "Done"
                    : Math.ceil(
                        (campaign.totalRecipients - campaign.sentCount - campaign.failedCount) /
                          campaign.dailyLimit
                      )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {campaign.status === "completed" ? "Campaign completed" : "days remaining"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "start" && "Start Campaign"}
              {actionType === "pause" && "Pause Campaign"}
              {actionType === "cancel" && "Cancel Campaign"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "start" && (
                <>
                  Start sending "{campaign.name}"? Emails will be sent at a rate of{" "}
                  {campaign.dailyLimit} per day. The cron job runs every hour to process the queue.
                </>
              )}
              {actionType === "pause" && (
                <>
                  Pause "{campaign.name}"? No more emails will be sent until you resume.
                </>
              )}
              {actionType === "cancel" && (
                <>
                  Cancel "{campaign.name}"? All pending emails will be discarded. Emails already
                  sent cannot be recalled.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={
                actionType === "cancel" ? "bg-destructive text-white hover:bg-destructive/90" : ""
              }
            >
              {actionType === "start" && "Start Sending"}
              {actionType === "pause" && "Pause"}
              {actionType === "cancel" && "Cancel Campaign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Email Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to preview how it will look in an inbox.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!testEmail.trim() || sendTestEmailMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>Subject: {campaign.subject}</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg bg-white overflow-hidden">
            <iframe
              srcDoc={campaign.content}
              className="w-full h-[70vh] border-0"
              title="Email preview"
              sandbox="allow-same-origin"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
