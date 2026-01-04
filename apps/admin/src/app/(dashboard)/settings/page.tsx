"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, Title, Text } from "@tremor/react";
import {
  Settings,
  Activity,
  Store,
  DollarSign,
  Truck,
  Mail,
  Loader2,
  Save,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useSettings, useUpdateSettings, SettingsData } from "@/hooks/use-settings";

// Form schema matching database structure
const settingsSchema = z.object({
  // Business/Store
  business_name: z.string().min(1, "Store name is required"),
  business_email: z.string().email("Invalid email"),
  business_phone: z.string(),
  business_address: z.string(),
  // Currency
  currency: z.string(),
  currency_symbol: z.string(),
  // Tax
  tax_rate: z.number().min(0).max(100),
  tax_label: z.string(),
  tax_enabled: z.boolean(),
  // Delivery/Shipping
  delivery_fee: z.number().min(0),
  delivery_enabled: z.boolean(),
  free_delivery_threshold: z.number().min(0),
  // Notifications
  email_notifications: z.boolean(),
  low_stock_notifications: z.boolean(),
  new_order_notifications: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const defaultSettings: SettingsFormData = {
  business_name: "Lab404 Electronics",
  business_email: "info@lab404.com",
  business_phone: "",
  business_address: "",
  currency: "USD",
  currency_symbol: "$",
  tax_rate: 0,
  tax_label: "VAT",
  tax_enabled: false,
  delivery_fee: 0,
  delivery_enabled: false,
  free_delivery_threshold: 0,
  email_notifications: true,
  low_stock_notifications: true,
  new_order_notifications: true,
};

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettings,
  });

  // Load settings into form when data arrives
  useEffect(() => {
    if (settings) {
      reset({
        business_name: settings.business_name || defaultSettings.business_name,
        business_email: settings.business_email || defaultSettings.business_email,
        business_phone: settings.business_phone || defaultSettings.business_phone,
        business_address: settings.business_address || defaultSettings.business_address,
        currency: settings.currency || defaultSettings.currency,
        currency_symbol: settings.currency_symbol || defaultSettings.currency_symbol,
        tax_rate: settings.tax_rate ?? defaultSettings.tax_rate,
        tax_label: settings.tax_label || defaultSettings.tax_label,
        tax_enabled: settings.tax_enabled ?? defaultSettings.tax_enabled,
        delivery_fee: settings.delivery_fee ?? defaultSettings.delivery_fee,
        delivery_enabled: settings.delivery_enabled ?? defaultSettings.delivery_enabled,
        free_delivery_threshold: settings.free_delivery_threshold ?? defaultSettings.free_delivery_threshold,
        email_notifications: settings.email_notifications ?? defaultSettings.email_notifications,
        low_stock_notifications: settings.low_stock_notifications ?? defaultSettings.low_stock_notifications,
        new_order_notifications: settings.new_order_notifications ?? defaultSettings.new_order_notifications,
      });
    }
  }, [settings, reset]);

  // Watch form values for conditional rendering
  const taxEnabled = watch("tax_enabled");
  const deliveryEnabled = watch("delivery_enabled");
  const emailNotifications = watch("email_notifications");
  const lowStockNotifications = watch("low_stock_notifications");
  const newOrderNotifications = watch("new_order_notifications");
  const currency = watch("currency");

  const onSubmit = async (data: SettingsFormData) => {
    await updateSettings.mutateAsync(data);
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
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your store settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/pdf-templates">
              <FileText className="mr-2 h-4 w-4" />
              PDF Templates
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings/notifications">
              <Mail className="mr-2 h-4 w-4" />
              Admin Notifications
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings/activity">
              <Activity className="mr-2 h-4 w-4" />
              Activity Logs
            </Link>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Store Information */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Title>Store Information</Title>
                <Text className="text-muted-foreground">
                  Basic store details
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Store Name</Label>
                <Input id="business_name" {...register("business_name")} />
                {errors.business_name && (
                  <p className="text-sm text-destructive">
                    {errors.business_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_email">Email</Label>
                <Input id="business_email" type="email" {...register("business_email")} />
                {errors.business_email && (
                  <p className="text-sm text-destructive">
                    {errors.business_email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_phone">Phone</Label>
                <Input id="business_phone" {...register("business_phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_address">Address</Label>
                <Textarea id="business_address" rows={2} {...register("business_address")} />
              </div>
            </div>
          </Card>

          {/* Tax & Currency */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <Title>Tax & Currency</Title>
                <Text className="text-muted-foreground">
                  Financial settings
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={currency}
                  onValueChange={(v) => setValue("currency", v, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Tax</Label>
                  <p className="text-sm text-muted-foreground">
                    Apply tax to orders
                  </p>
                </div>
                <Switch
                  checked={taxEnabled}
                  onCheckedChange={(v) => setValue("tax_enabled", v, { shouldDirty: true })}
                />
              </div>

              {taxEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      {...register("tax_rate", { valueAsNumber: true })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter as percentage (e.g., 10 for 10%)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_label">Tax Label</Label>
                    <Input
                      id="tax_label"
                      {...register("tax_label")}
                      placeholder="e.g., VAT, Sales Tax"
                    />
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Shipping/Delivery */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <Title>Shipping</Title>
                <Text className="text-muted-foreground">
                  Delivery settings
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Delivery Fees</Label>
                  <p className="text-sm text-muted-foreground">
                    Charge delivery fees for orders
                  </p>
                </div>
                <Switch
                  checked={deliveryEnabled}
                  onCheckedChange={(v) => setValue("delivery_enabled", v, { shouldDirty: true })}
                />
              </div>

              {deliveryEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="delivery_fee">Delivery Fee</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.01"
                    {...register("delivery_fee", { valueAsNumber: true })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="free_delivery_threshold">
                  Free Delivery Threshold
                </Label>
                <Input
                  id="free_delivery_threshold"
                  type="number"
                  step="0.01"
                  {...register("free_delivery_threshold", { valueAsNumber: true })}
                />
                <p className="text-sm text-muted-foreground">
                  Orders above this amount qualify for free delivery (0 to disable)
                </p>
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Mail className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <Title>Email Notifications</Title>
                <Text className="text-muted-foreground">
                  Notification preferences
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications to admins
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={(v) => setValue("email_notifications", v, { shouldDirty: true })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>New Order Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when new orders are placed
                  </p>
                </div>
                <Switch
                  checked={newOrderNotifications}
                  onCheckedChange={(v) => setValue("new_order_notifications", v, { shouldDirty: true })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when products are low on stock
                  </p>
                </div>
                <Switch
                  checked={lowStockNotifications}
                  onCheckedChange={(v) => setValue("low_stock_notifications", v, { shouldDirty: true })}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={updateSettings.isPending || !isDirty}>
            {updateSettings.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
          <Button type="button" variant="outline" onClick={() => reset()}>
            Reset Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
