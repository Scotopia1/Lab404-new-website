"use client";

import { useState, useEffect } from "react";
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
  storeName: z.string().min(1, "Store name is required"),
  storeEmail: z.string().email("Invalid email"),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  currency: z.string(),
  taxRate: z.number().min(0).max(100),
  taxEnabled: z.boolean(),
  freeShippingThreshold: z.number().min(0),
  flatShippingRate: z.number().min(0),
  emailOrderConfirmation: z.boolean(),
  emailShippingUpdates: z.boolean(),
  lowStockThreshold: z.number().min(0),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const defaultSettings: SettingsFormData = {
  storeName: "Lab404 Electronics",
  storeEmail: "contact@lab404.com",
  storePhone: "+1 (555) 123-4567",
  storeAddress: "123 Electronics Street, Tech City, TC 12345",
  currency: "USD",
  taxRate: 10,
  taxEnabled: true,
  freeShippingThreshold: 100,
  flatShippingRate: 9.99,
  emailOrderConfirmation: true,
  emailShippingUpdates: true,
  lowStockThreshold: 10,
};

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
    if (settings && Array.isArray(settings)) {
      const mapped: Partial<SettingsFormData> = {};
      settings.forEach((s) => {
        if (s.key in defaultSettings) {
          (mapped as Record<string, unknown>)[s.key] = s.value;
        }
      });
      reset({ ...defaultSettings, ...mapped });
    }
  }, [settings, reset]);

  const taxEnabled = watch("taxEnabled");
  const emailOrderConfirmation = watch("emailOrderConfirmation");
  const emailShippingUpdates = watch("emailShippingUpdates");

  const onSubmit = async (data: SettingsFormData) => {
    await updateSettings.mutateAsync(data as unknown as Record<string, unknown>);
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
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" {...register("storeName")} />
                {errors.storeName && (
                  <p className="text-sm text-destructive">
                    {errors.storeName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeEmail">Email</Label>
                <Input id="storeEmail" type="email" {...register("storeEmail")} />
                {errors.storeEmail && (
                  <p className="text-sm text-destructive">
                    {errors.storeEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="storePhone">Phone</Label>
                <Input id="storePhone" {...register("storePhone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeAddress">Address</Label>
                <Textarea id="storeAddress" rows={2} {...register("storeAddress")} />
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
                  defaultValue="USD"
                  onValueChange={(v) => setValue("currency", v)}
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
                  onCheckedChange={(v) => setValue("taxEnabled", v)}
                />
              </div>

              {taxEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    {...register("taxRate", { valueAsNumber: true })}
                  />
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
                <Label htmlFor="flatShippingRate">Flat Shipping Rate</Label>
                <Input
                  id="flatShippingRate"
                  type="number"
                  step="0.01"
                  {...register("flatShippingRate", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">
                  Free Shipping Threshold
                </Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  step="0.01"
                  {...register("freeShippingThreshold", { valueAsNumber: true })}
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
                  onCheckedChange={(v) => setValue("emailOrderConfirmation", v)}
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
                  onCheckedChange={(v) => setValue("emailShippingUpdates", v)}
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
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  {...register("lowStockThreshold", { valueAsNumber: true })}
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
