"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Title, Text } from "@tremor/react";
import {
  Bell,
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface NotificationSettings {
  enabled: boolean;
  adminEmails: string[];
  smtpConfigured: boolean;
  notifications: {
    new_order: boolean;
    order_status_change: boolean;
    low_stock_alert: boolean;
    new_customer: boolean;
    new_contact_message: boolean;
    quotation_request: boolean;
    payment_received: boolean;
    refund_processed: boolean;
  };
}

type NotificationType = keyof NotificationSettings["notifications"];

const notificationLabels: Record<NotificationType, { label: string; description: string }> = {
  new_order: {
    label: "New Orders",
    description: "When a new order is placed",
  },
  order_status_change: {
    label: "Order Status Changes",
    description: "When an order status is updated",
  },
  low_stock_alert: {
    label: "Low Stock Alerts",
    description: "When a product falls below stock threshold",
  },
  new_customer: {
    label: "New Customers",
    description: "When a new customer registers",
  },
  new_contact_message: {
    label: "Contact Messages",
    description: "When a new contact form is submitted",
  },
  quotation_request: {
    label: "Quotation Requests",
    description: "When a new quotation is requested",
  },
  payment_received: {
    label: "Payments Received",
    description: "When a payment is confirmed",
  },
  refund_processed: {
    label: "Refunds Processed",
    description: "When a refund is issued",
  },
};

export default function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState("");
  const [testType, setTestType] = useState<NotificationType>("new_order");
  const [newEmail, setNewEmail] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; data: NotificationSettings }>(
          "/notifications/settings"
        );
        return res.data.data;
      } catch {
        // Return default settings if API not available
        return {
          enabled: true,
          adminEmails: ["admin@lab404electronics.com"],
          smtpConfigured: false,
          notifications: {
            new_order: true,
            order_status_change: true,
            low_stock_alert: true,
            new_customer: true,
            new_contact_message: true,
            quotation_request: true,
            payment_received: true,
            refund_processed: true,
          },
        } as NotificationSettings;
      }
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      const res = await api.put("/notifications/settings", updates);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast.success("Settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const verifySmtp = useMutation({
    mutationFn: async () => {
      const res = await api.post("/notifications/verify-smtp");
      return res.data;
    },
    onSuccess: () => {
      toast.success("SMTP connection verified successfully");
    },
    onError: () => {
      toast.error("SMTP connection failed. Check your configuration.");
    },
  });

  const sendTestNotification = useMutation({
    mutationFn: async ({ type, email }: { type: NotificationType; email?: string }) => {
      const res = await api.post("/notifications/test", { type, email });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Test notification sent successfully");
    },
    onError: () => {
      toast.error("Failed to send test notification");
    },
  });

  const toggleNotification = (type: NotificationType) => {
    if (!settings) return;
    updateSettings.mutate({
      notifications: {
        ...settings.notifications,
        [type]: !settings.notifications[type],
      },
    });
  };

  const toggleEnabled = () => {
    if (!settings) return;
    updateSettings.mutate({ enabled: !settings.enabled });
  };

  const addEmail = () => {
    if (!settings || !newEmail) return;
    if (!newEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (settings.adminEmails.includes(newEmail)) {
      toast.error("Email already added");
      return;
    }
    updateSettings.mutate({
      adminEmails: [...settings.adminEmails, newEmail],
    });
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    if (!settings) return;
    if (settings.adminEmails.length === 1) {
      toast.error("At least one admin email is required");
      return;
    }
    updateSettings.mutate({
      adminEmails: settings.adminEmails.filter((e) => e !== email),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Admin Notifications
          </h1>
          <p className="text-muted-foreground">
            Configure email notifications for admin alerts
          </p>
        </div>
      </div>

      {/* SMTP Status Banner */}
      {!settings?.smtpConfigured && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                SMTP Not Configured
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Email notifications require SMTP configuration. Add SMTP settings
                to your environment variables.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Master Toggle & SMTP Status */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <Title>Notification Status</Title>
              <Text className="text-muted-foreground">
                Master controls for notifications
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Master switch for all admin notifications
                </p>
              </div>
              <Switch
                checked={settings?.enabled ?? true}
                onCheckedChange={toggleEnabled}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                {settings?.smtpConfigured ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  SMTP Status:{" "}
                  <span
                    className={
                      settings?.smtpConfigured
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {settings?.smtpConfigured ? "Connected" : "Not Configured"}
                  </span>
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => verifySmtp.mutate()}
                disabled={verifySmtp.isPending || !settings?.smtpConfigured}
              >
                {verifySmtp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Verify</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Admin Emails */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <Title>Admin Emails</Title>
              <Text className="text-muted-foreground">
                Recipients for admin notifications
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="admin@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEmail()}
              />
              <Button onClick={addEmail} disabled={!newEmail}>
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {settings?.adminEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <span className="text-sm">{email}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeEmail(email)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Notification Types */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <Title>Notification Types</Title>
              <Text className="text-muted-foreground">
                Choose which events trigger admin notifications
              </Text>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(Object.keys(notificationLabels) as NotificationType[]).map(
              (type) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <Label>{notificationLabels[type].label}</Label>
                    <p className="text-sm text-muted-foreground">
                      {notificationLabels[type].description}
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications[type] ?? true}
                    onCheckedChange={() => toggleNotification(type)}
                    disabled={!settings?.enabled}
                  />
                </div>
              )
            )}
          </div>
        </Card>

        {/* Test Notifications */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Send className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <Title>Test Notifications</Title>
              <Text className="text-muted-foreground">
                Send a test notification to verify your setup
              </Text>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="testType">Notification Type</Label>
              <Select
                value={testType}
                onValueChange={(v) => setTestType(v as NotificationType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(notificationLabels) as NotificationType[]).map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {notificationLabels[type].label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="testEmail">Test Email (Optional)</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="Leave empty to use admin emails"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() =>
                  sendTestNotification.mutate({
                    type: testType,
                    email: testEmail || undefined,
                  })
                }
                disabled={
                  sendTestNotification.isPending || !settings?.smtpConfigured
                }
              >
                {sendTestNotification.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Test
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
