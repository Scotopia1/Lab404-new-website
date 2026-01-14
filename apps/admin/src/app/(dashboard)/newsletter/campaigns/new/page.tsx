"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Send, Save, Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useCreateCampaign, useSubscriberStats, useSendTestEmail } from "@/hooks/use-newsletter";

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  subject: z.string().min(1, "Subject is required").max(255),
  previewText: z.string().max(255).optional(),
  content: z.string().min(1, "Content is required"),
  dailyLimit: z.coerce.number().int().min(1).max(10000).default(100),
  sendTime: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function NewCampaignPage() {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const createCampaign = useCreateCampaign();
  const sendTestEmail = useSendTestEmail();
  const { data: stats } = useSubscriberStats();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      dailyLimit: 100,
    },
  });

  const content = watch("content");
  const subject = watch("subject");

  const onSubmit = async (data: CampaignFormData) => {
    const campaign = await createCampaign.mutateAsync(data);
    router.push(`/newsletter/campaigns/${campaign.id}`);
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) return;
    // We need to save the campaign first to send a test
    // For now, just show an alert
    alert("Please save the campaign first, then send a test from the campaign detail page.");
    setShowTestDialog(false);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/newsletter/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Campaign</h1>
          <p className="text-muted-foreground">
            Create a new newsletter campaign for {stats?.active || 0} active subscribers
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Basic information about your campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., January Newsletter"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Internal name to identify this campaign
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., New Products Just Arrived!"
                    {...register("subject")}
                  />
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previewText">Preview Text</Label>
                  <Input
                    id="previewText"
                    placeholder="Brief preview shown in email clients"
                    {...register("previewText")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown next to subject in most email clients
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>
                  Write your newsletter content in HTML. An unsubscribe link will be added
                  automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="content">Content (HTML) *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                  <Textarea
                    id="content"
                    rows={20}
                    placeholder={`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello!</h1>
    <p>Your newsletter content goes here...</p>
  </div>
</body>
</html>`}
                    {...register("content")}
                    className="font-mono text-sm"
                  />
                  {errors.content && (
                    <p className="text-sm text-destructive">{errors.content.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sending Options</CardTitle>
                <CardDescription>Configure how emails are sent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Daily Send Limit *</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    min={1}
                    max={10000}
                    {...register("dailyLimit")}
                  />
                  {errors.dailyLimit && (
                    <p className="text-sm text-destructive">{errors.dailyLimit.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum emails to send per day. Recommended: 100-500 to avoid spam filters.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendTime">Preferred Send Time</Label>
                  <Input
                    id="sendTime"
                    type="time"
                    {...register("sendTime")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional. The cron job runs every hour.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Recipients:</span>{" "}
                      <span className="font-medium">{stats?.active || 0} subscribers</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Est. days to complete:</span>{" "}
                      <span className="font-medium">
                        {stats?.active && watch("dailyLimit")
                          ? Math.ceil(stats.active / (watch("dailyLimit") || 100))
                          : "-"}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createCampaign.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  After saving, you can send a test email and start the campaign.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>Subject: {subject || "(No subject)"}</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div dangerouslySetInnerHTML={{ __html: content || "<p>No content yet</p>" }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to preview how it will look.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Email Address</Label>
              <Input
                id="testEmail"
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
            <Button onClick={handleSendTest} disabled={!testEmail.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
