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
import { useSettings, useBulkUpdateSettings } from "@/hooks/use-settings";

const settingsSchema = z.object({
  company_name: z.string().min(1, "Store name is required"),
  company_email: z.string().email("Invalid email"),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
  default_currency: z.string(),
  tax_rate: z.string(),
  tax_enabled: z.string(),
  free_shipping_threshold: z.string(),
  default_shipping_rate: z.string(),
  email_order_confirmation: z.string(),
  email_shipping_updates: z.string(),
  low_stock_threshold: z.string(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const defaultSettings: SettingsFormData = {
  company_name: "Lab404 Electronics",
  company_email: "contact@lab404.com",
  company_phone: "",
  company_address: "",
  default_currency: "USD",
  tax_rate: "0.1",
  tax_enabled: "true",
  free_shipping_threshold: "100",
  default_shipping_rate: "9.99",
  email_order_confirmation: "true",
  email_shipping_updates: "true",
  low_stock_threshold: "10",
};

// Helper to get setting value from categorized API response
function getSettingValue(
  settings: Record<string, Record<string, { value: string }>> | undefined,
  key: string
): string | undefined {
  if (!settings) return undefined;
  for (const category of Object.values(settings)) {
    if (category[key]) {
      return category[key].value;
    }
  }
  return undefined;
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useBulkUpdateSettings();

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

  useEffect(() => {
    if (settings && typeof settings === "object" && !Array.isArray(settings)) {
      const mapped: Partial<SettingsFormData> = {};
      for (const key of Object.keys(defaultSettings) as (keyof SettingsFormData)[]) {
        const value = getSettingValue(settings as Record<string, Record<string, { value: string }>>, key);
        if (value !== undefined) {
          mapped[key] = value;
        }
      }
      reset({ ...defaultSettings, ...mapped });
    }
  }, [settings, reset]);

  const taxEnabled = watch("tax_enabled") === "true";
  const emailOrderConfirmation = watch("email_order_confirmation") === "true";
  const emailShippingUpdates = watch("email_shipping_updates") === "true";
  const currency = watch("default_currency");

  const onSubmit = async (data: SettingsFormData) => {
    // Convert form data to array format expected by API
    const settingsArray = Object.entries(data).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    await updateSettings.mutateAsync({ settings: settingsArray });
  };

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
                <Label htmlFor="company_name">Store Name</Label>
                <Input id="company_name" {...register("company_name")} />
                {errors.company_name && (
                  <p className="text-sm text-destructive">
                    {errors.company_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_email">Email</Label>
                <Input id="company_email" type="email" {...register("company_email")} />
                {errors.company_email && (
                  <p className="text-sm text-destructive">
                    {errors.company_email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_phone">Phone</Label>
                <Input id="company_phone" {...register("company_phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_address">Address</Label>
                <Textarea id="company_address" rows={2} {...register("company_address")} />
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
                <Label htmlFor="default_currency">Currency</Label>
                <Select
                  value={currency}
                  onValueChange={(v) => setValue("default_currency", v, { shouldDirty: true })}
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
                  onCheckedChange={(v) => setValue("tax_enabled", v ? "true" : "false", { shouldDirty: true })}
                />
              </div>

              {taxEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    value={parseFloat(watch("tax_rate") || "0") * 100}
                    onChange={(e) => setValue("tax_rate", String(parseFloat(e.target.value) / 100), { shouldDirty: true })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Current: {(parseFloat(watch("tax_rate") || "0") * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Shipping */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <Title>Shipping</Title>
                <Text className="text-muted-foreground">
                  Shipping settings
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default_shipping_rate">Flat Shipping Rate</Label>
                <Input
                  id="default_shipping_rate"
                  type="number"
                  step="0.01"
                  {...register("default_shipping_rate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="free_shipping_threshold">
                  Free Shipping Threshold
                </Label>
                <Input
                  id="free_shipping_threshold"
                  type="number"
                  step="0.01"
                  {...register("free_shipping_threshold")}
                />
                <p className="text-sm text-muted-foreground">
                  Orders above this amount qualify for free shipping
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
                  Customer notification settings
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Order Confirmation</Label>
                  <p className="text-sm text-muted-foreground">
                    Send order confirmation emails
                  </p>
                </div>
                <Switch
                  checked={emailOrderConfirmation}
                  onCheckedChange={(v) => setValue("email_order_confirmation", v ? "true" : "false", { shouldDirty: true })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Shipping Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Send shipping status updates
                  </p>
                </div>
                <Switch
                  checked={emailShippingUpdates}
                  onCheckedChange={(v) => setValue("email_shipping_updates", v ? "true" : "false", { shouldDirty: true })}
                />
              </div>
            </div>
          </Card>

          {/* Inventory */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Settings className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <Title>Inventory</Title>
                <Text className="text-muted-foreground">
                  Stock management settings
                </Text>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  {...register("low_stock_threshold")}
                />
                <p className="text-sm text-muted-foreground">
                  Products with stock below this will be marked as low stock
                </p>
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
