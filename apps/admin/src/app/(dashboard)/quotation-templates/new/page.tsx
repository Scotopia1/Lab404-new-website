"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useProducts } from "@/hooks/use-products";
import {
  useCreateQuotationTemplate,
  TemplateItem,
} from "@/hooks/use-quotation-templates";
import { TermsEditor } from "@/components/quotations/terms-editor";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  defaultDiscount: z.string().optional(),
  defaultDiscountType: z.enum(["percentage", "fixed"]).optional(),
  defaultTaxRate: z.string().optional(),
  defaultValidDays: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface LineItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  isCustom: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [termsContent, setTermsContent] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Custom item form state
  const [customItem, setCustomItem] = useState({
    name: "",
    description: "",
    sku: "",
    quantity: 1,
    unitPrice: 0,
  });

  const { data: products } = useProducts({ search: productSearch, limit: 20 });
  const createTemplate = useCreateQuotationTemplate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      defaultValidDays: "30",
      defaultDiscountType: "percentage",
    },
  });

  const discountType = watch("defaultDiscountType");

  const addProductToItems = (product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    description?: string;
  }) => {
    const existingIndex = lineItems.findIndex(
      (item) => item.productId === product.id
    );

    if (existingIndex >= 0) {
      const updated = [...lineItems];
      updated[existingIndex].quantity += 1;
      setLineItems(updated);
    } else {
      setLineItems([
        ...lineItems,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          description: product.description,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.price,
          isCustom: false,
        },
      ]);
    }
    setProductSearchOpen(false);
    setProductSearch("");
  };

  const addCustomItem = () => {
    if (!customItem.name || customItem.unitPrice <= 0) {
      toast.error("Please enter a name and price for the custom item.");
      return;
    }

    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        name: customItem.name,
        description: customItem.description || undefined,
        sku: customItem.sku || undefined,
        quantity: customItem.quantity,
        unitPrice: customItem.unitPrice,
        isCustom: true,
      },
    ]);

    setCustomItem({
      name: "",
      description: "",
      sku: "",
      quantity: 1,
      unitPrice: 0,
    });
    setShowCustomForm(false);
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const updateItemPrice = (id: string, unitPrice: number) => {
    if (unitPrice < 0) return;
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, unitPrice } : item))
    );
  };

  const removeItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  };

  const onSubmit = async (data: TemplateFormData) => {
    if (lineItems.length === 0) {
      toast.error("Please add at least one item to the template.");
      return;
    }

    try {
      const items: TemplateItem[] = lineItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      await createTemplate.mutateAsync({
        name: data.name,
        description: data.description,
        items,
        defaultDiscount: data.defaultDiscount
          ? parseFloat(data.defaultDiscount)
          : undefined,
        defaultDiscountType: data.defaultDiscountType,
        defaultTaxRate: data.defaultTaxRate
          ? parseFloat(data.defaultTaxRate) / 100
          : undefined,
        defaultValidDays: data.defaultValidDays
          ? parseInt(data.defaultValidDays)
          : undefined,
        defaultTerms: termsContent || undefined,
      });

      toast.success(`"${data.name}" has been created successfully.`);
      router.push("/quotation-templates");
    } catch {
      toast.error("Failed to create template. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Template</h1>
          <p className="text-muted-foreground">
            Create a reusable quotation template
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="e.g., Standard Electronics Package"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe what this template is for..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Template Items</CardTitle>
                <div className="flex gap-2">
                  <Popover
                    open={productSearchOpen}
                    onOpenChange={setProductSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Search className="mr-2 h-4 w-4" />
                        Add Product
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="end">
                      <Command>
                        <CommandInput
                          placeholder="Search products..."
                          value={productSearch}
                          onValueChange={setProductSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No products found.</CommandEmpty>
                          <CommandGroup>
                            {products?.data?.map((product) => (
                              <CommandItem
                                key={product.id}
                                onSelect={() =>
                                  addProductToItems({
                                    id: product.id,
                                    name: product.name,
                                    sku: product.sku || "",
                                    price: product.basePrice,
                                    description: product.description || undefined,
                                  })
                                }
                              >
                                <div className="flex flex-col">
                                  <span>{product.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {product.sku} · {formatCurrency(product.basePrice)}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomForm(!showCustomForm)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Custom Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Custom Item Form */}
                {showCustomForm && (
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                    <h4 className="font-medium">Add Custom Item</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Item Name *</Label>
                        <Input
                          value={customItem.name}
                          onChange={(e) =>
                            setCustomItem({ ...customItem, name: e.target.value })
                          }
                          placeholder="Item name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input
                          value={customItem.sku}
                          onChange={(e) =>
                            setCustomItem({ ...customItem, sku: e.target.value })
                          }
                          placeholder="SKU (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={customItem.unitPrice || ""}
                          onChange={(e) =>
                            setCustomItem({
                              ...customItem,
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={customItem.quantity}
                          onChange={(e) =>
                            setCustomItem({
                              ...customItem,
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={customItem.description}
                          onChange={(e) =>
                            setCustomItem({
                              ...customItem,
                              description: e.target.value,
                            })
                          }
                          placeholder="Item description (optional)"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={addCustomItem}>
                        Add Item
                      </Button>
                    </div>
                  </div>
                )}

                {/* Items List */}
                {lineItems.length > 0 ? (
                  <div className="space-y-2">
                    {lineItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {item.name}
                            </span>
                            {item.isCustom && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                Custom
                              </span>
                            )}
                          </div>
                          {item.sku && (
                            <span className="text-sm text-muted-foreground">
                              SKU: {item.sku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(
                                item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20"
                          />
                          <span className="text-muted-foreground">×</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItemPrice(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28"
                          />
                          <span className="w-24 text-right font-medium">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-4 border-t">
                      <div className="text-right">
                        <span className="text-muted-foreground">Base Total: </span>
                        <span className="text-xl font-bold">
                          {formatCurrency(calculateSubtotal())}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No items added yet. Add products or custom items above.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Default Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Default Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <TermsEditor
                  content={termsContent}
                  onChange={setTermsContent}
                  placeholder="Enter default terms and conditions for quotations using this template..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Default Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Default Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Valid Days</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    {...register("defaultValidDays")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Default validity period for quotations
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Default Discount</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("defaultDiscount")}
                      placeholder="0"
                      className="flex-1"
                    />
                    <Select
                      value={discountType}
                      onValueChange={(v) =>
                        setValue("defaultDiscountType", v as "percentage" | "fixed")
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">$</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Default Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    {...register("defaultTaxRate")}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={createTemplate.isPending}>
                    {createTemplate.isPending ? "Creating..." : "Create Template"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
