"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Package,
  ArrowLeft,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { usePromoCode, useUpdatePromoCode } from "@/hooks/use-promo-codes";
import { ProductCategoryRestrictions } from "@/components/promo-codes/ProductCategoryRestrictions";
import { formatDate } from "@/lib/utils";

const promoCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .transform((val) => val.toUpperCase()),
  description: z.string().max(500).optional().or(z.literal("")),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce
    .number()
    .min(0.01, "Discount value must be greater than 0"),
  minimumOrderAmount: z.coerce.number().min(0).optional(),
  maximumDiscountAmount: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().min(0).optional(),
  usageLimitPerCustomer: z.coerce.number().int().min(1).optional(),
  validFrom: z.string().optional().or(z.literal("")),
  validTo: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

type PromoCodeFormData = z.input<typeof promoCodeSchema>;

function formatDateForInput(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
}

export default function EditPromoCodePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [restrictionsChanged, setRestrictionsChanged] = useState(false);

  const { data: promoCode, isLoading: isPromoLoading } = usePromoCode(id);
  const updatePromoCode = useUpdatePromoCode();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minimumOrderAmount: 0,
      maximumDiscountAmount: 0,
      maxUses: 0,
      usageLimitPerCustomer: 1,
      validFrom: "",
      validTo: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (promoCode) {
      reset(
        {
          code: promoCode.code,
          description: promoCode.description || "",
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          minimumOrderAmount: promoCode.minimumOrderAmount || 0,
          maximumDiscountAmount: promoCode.maximumDiscountAmount || 0,
          maxUses: promoCode.maxUses || 0,
          usageLimitPerCustomer: promoCode.usageLimitPerCustomer || 1,
          validFrom: formatDateForInput(promoCode.validFrom),
          validTo: formatDateForInput(promoCode.validTo),
          isActive: promoCode.isActive,
        },
        {
          keepDirty: false,
        }
      );
      // Set restrictions
      setSelectedProducts(promoCode.appliesToProducts || []);
      setSelectedCategories(promoCode.appliesToCategories || []);
      setRestrictionsChanged(false);
    }
  }, [promoCode, reset]);

  const discountType = watch("discountType");
  const isActive = watch("isActive");

  const handleProductsChange = (products: string[]) => {
    setSelectedProducts(products);
    setRestrictionsChanged(true);
  };

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories);
    setRestrictionsChanged(true);
  };

  const hasChanges = isDirty || restrictionsChanged;

  const onSubmit = async (data: PromoCodeFormData) => {
    const submitData = {
      ...data,
      minimumOrderAmount: data.minimumOrderAmount || undefined,
      maximumDiscountAmount: data.maximumDiscountAmount || undefined,
      maxUses: data.maxUses || undefined,
      usageLimitPerCustomer: data.usageLimitPerCustomer || undefined,
      validFrom: data.validFrom || undefined,
      validTo: data.validTo || undefined,
      description: data.description || undefined,
      appliesToProducts: selectedProducts.length > 0 ? selectedProducts : undefined,
      appliesToCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
    };
    await updatePromoCode.mutateAsync({ id, data: submitData });
    router.push("/promo-codes");
  };

  if (isPromoLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!promoCode) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Promo code not found</p>
        <Button variant="outline" onClick={() => router.push("/promo-codes")}>
          Back to Promo Codes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/promo-codes")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Edit Promo Code</h1>
          <p className="text-muted-foreground">
            Update promo code: <span className="font-mono">{promoCode.code}</span>
          </p>
        </div>
        {hasChanges && (
          <Badge variant="warning" className="animate-pulse">
            Unsaved changes
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Set up the promo code and its description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      {...register("code")}
                      placeholder="SAVE20"
                      className={`uppercase ${errors.code ? "border-destructive" : ""}`}
                      onChange={(e) => {
                        setValue("code", e.target.value.toUpperCase(), {
                          shouldDirty: true,
                        });
                      }}
                    />
                    {errors.code && (
                      <p className="text-sm text-destructive">
                        {errors.code.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Customers will enter this code at checkout
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-3 pt-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) =>
                          setValue("isActive", checked, { shouldDirty: true })
                        }
                      />
                      <span
                        className={
                          isActive ? "text-green-600" : "text-muted-foreground"
                        }
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe this promo code (e.g., Summer sale 20% off)"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Internal description for reference
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Discount Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Discount Settings</CardTitle>
                    <CardDescription>
                      Configure the discount type and value
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Discount Type *</Label>
                    <Select
                      value={discountType}
                      onValueChange={(value) =>
                        setValue("discountType", value as "percentage" | "fixed", {
                          shouldDirty: true,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            Percentage
                          </div>
                        </SelectItem>
                        <SelectItem value="fixed">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Fixed Amount
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">
                      Discount Value *{" "}
                      <span className="text-muted-foreground">
                        ({discountType === "percentage" ? "%" : "$"})
                      </span>
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("discountValue")}
                      className={errors.discountValue ? "border-destructive" : ""}
                    />
                    {errors.discountValue && (
                      <p className="text-sm text-destructive">
                        {errors.discountValue.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minimumOrderAmount">
                      Minimum Order Amount ($)
                    </Label>
                    <Input
                      id="minimumOrderAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("minimumOrderAmount")}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave at 0 for no minimum
                    </p>
                  </div>
                  {discountType === "percentage" && (
                    <div className="space-y-2">
                      <Label htmlFor="maximumDiscountAmount">
                        Maximum Discount ($)
                      </Label>
                      <Input
                        id="maximumDiscountAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("maximumDiscountAmount")}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Cap the discount amount (0 = no cap)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Usage Limits</CardTitle>
                    <CardDescription>
                      Control how many times this code can be used
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Total Usage Limit</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="0"
                      {...register("maxUses")}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum total uses (0 = unlimited)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usageLimitPerCustomer">
                      Uses Per Customer
                    </Label>
                    <Input
                      id="usageLimitPerCustomer"
                      type="number"
                      min="1"
                      {...register("usageLimitPerCustomer")}
                      placeholder="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      How many times each customer can use this code
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validity Period */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Validity Period</CardTitle>
                    <CardDescription>
                      Set when this promo code is valid
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Start Date</Label>
                    <Input
                      id="validFrom"
                      type="datetime-local"
                      {...register("validFrom")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to start immediately
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validTo">End Date</Label>
                    <Input
                      id="validTo"
                      type="datetime-local"
                      {...register("validTo")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for no expiration
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Restrictions */}
            <ProductCategoryRestrictions
              selectedProducts={selectedProducts}
              selectedCategories={selectedCategories}
              onProductsChange={handleProductsChange}
              onCategoriesChange={handleCategoriesChange}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`font-medium ${isActive ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">
                    {watch("discountValue") || 0}
                    {discountType === "percentage" ? "%" : " $"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min. Order:</span>
                  <span className="font-medium">
                    {watch("minimumOrderAmount")
                      ? `$${watch("minimumOrderAmount")}`
                      : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage Limit:</span>
                  <span className="font-medium">
                    {watch("maxUses") ? watch("maxUses") : "Unlimited"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per Customer:</span>
                  <span className="font-medium">
                    {watch("usageLimitPerCustomer") || 1}x
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Times Used:</span>
                  <span className="font-medium">{promoCode.usedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {formatDate(promoCode.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium">
                    {formatDate(promoCode.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Restrictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Products:
                  </span>
                  <span className="font-medium">
                    {selectedProducts.length || "All"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <FolderTree className="h-4 w-4" />
                    Categories:
                  </span>
                  <span className="font-medium">
                    {selectedCategories.length || "All"}
                  </span>
                </div>
                {(selectedProducts.length > 0 || selectedCategories.length > 0) && (
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    Code applies only to selected items
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-4 sticky bottom-0 bg-background py-4 border-t -mx-6 px-6">
          <Button type="submit" disabled={isSubmitting || !hasChanges}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/promo-codes")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
