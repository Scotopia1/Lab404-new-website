"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useNewsletterCampaign, useUpdateCampaign } from "@/hooks/use-newsletter";

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  subject: z.string().min(1, "Subject is required").max(255),
  previewText: z.string().max(255).optional(),
  content: z.string().min(1, "Content is required"),
  dailyLimit: z.coerce.number().int().min(1).max(10000),
  sendTime: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [showPreview, setShowPreview] = useState(false);

  const { data: campaign, isLoading } = useNewsletterCampaign(id);
  const updateCampaign = useUpdateCampaign();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
  });

  useEffect(() => {
    if (campaign) {
      reset({
        name: campaign.name,
        subject: campaign.subject,
        previewText: campaign.previewText || "",
        content: campaign.content,
        dailyLimit: campaign.dailyLimit,
        sendTime: campaign.sendTime || "",
      });
    }
  }, [campaign, reset]);

  const content = watch("content");
  const subject = watch("subject");

  const onSubmit = async (data: CampaignFormData) => {
    await updateCampaign.mutateAsync({ id, data });
    router.push(`/newsletter/campaigns/${id}`);
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
            <p className="text-lg font-medium">Campaign not found</p>
            <Button asChild className="mt-4">
              <Link href="/newsletter/campaigns">Back to Campaigns</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!["draft", "scheduled", "paused"].includes(campaign.status)) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-lg font-medium">
              Cannot edit a campaign that is {campaign.status}
            </p>
            <Button asChild className="mt-4">
              <Link href={`/newsletter/campaigns/${id}`}>View Campaign</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/newsletter/campaigns/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Campaign</h1>
          <p className="text-muted-foreground">{campaign.name}</p>
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
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input id="subject" {...register("subject")} />
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previewText">Preview Text</Label>
                  <Input id="previewText" {...register("previewText")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>Write your newsletter content in HTML</CardDescription>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendTime">Preferred Send Time</Label>
                  <Input id="sendTime" type="time" {...register("sendTime")} />
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
                  disabled={updateCampaign.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link href={`/newsletter/campaigns/${id}`}>Cancel</Link>
                </Button>
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
    </div>
  );
}
