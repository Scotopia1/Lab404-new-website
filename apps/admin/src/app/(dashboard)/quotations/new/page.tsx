"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Search, Percent, DollarSign, Package, PencilLine, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useCreateQuotation } from "@/hooks/use-quotations";
import { useProducts } from "@/hooks/use-products";
import { useCustomers } from "@/hooks/use-customers";
import { useProductVariants, ProductVariant, formatVariantOptions } from "@/hooks/use-product-variants";
import { useQuotationTemplates, useQuotationTemplate } from "@/hooks/use-quotation-templates";
import { VariantSelector } from "@/components/quotations/variant-selector";
import { TermsEditor } from "@/components/quotations/terms-editor";
import { formatCurrency } from "@/lib/utils";

const quotationSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  customerCompany: z.string().optional(),
  validDays: z.number().int().min(1).max(365).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
}).superRefine((data, ctx) => {
  // Only validate manual fields if no existing customer is selected
  if (!data.customerId) {
    if (!data.customerName || data.customerName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Customer name is required",
        path: ["customerName"],
      });
    }
    if (!data.customerEmail || data.customerEmail.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Customer email is required",
        path: ["customerEmail"],
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid email is required",
        path: ["customerEmail"],
      });
    }
  }
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface LineItem {
  id: string; // Unique identifier for the line item
  productId: string | null;
  variantId?: string | null;
  variantOptions?: Record<string, string>;
  productName: string;
  description?: string;
  sku?: string | null;
  quantity: number;
  price: number;
  isCustom: boolean;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdFromUrl = searchParams.get("templateId");
  const createQuotation = useCreateQuotation();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templateIdFromUrl);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  // Discount and Tax state
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(11); // Default 11%

  // Custom item state
  const [itemInputMode, setItemInputMode] = useState<"search" | "custom">("search");
  const [customItem, setCustomItem] = useState({
    name: "",
    description: "",
    sku: "",
    quantity: 1,
    unitPrice: 0,
  });

  // Variant selection state
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<{
    id: string;
    name: string;
    price: number;
  } | null>(null);

  // Rich text terms content
  const [termsContent, setTermsContent] = useState("");

  // Fetch variants for the pending product
  const { data: productVariants } = useProductVariants(pendingProduct?.id || null);

  const { data: productsData } = useProducts({ search: productSearch, limit: 10 });
  const { data: customersData } = useCustomers({ search: customerSearch, limit: 10 });

  // Template hooks
  const { data: templates } = useQuotationTemplates(true);
  const { data: selectedTemplate } = useQuotationTemplate(selectedTemplateId || "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerCompany: "",
      validDays: 30,
      notes: "",
      terms: "",
    },
  });

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate) {
      // Convert template items to line items
      const newLineItems: LineItem[] = selectedTemplate.items.map((item) => ({
        id: crypto.randomUUID(),
        productId: item.productId || null,
        productName: item.name,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        price: item.unitPrice,
        isCustom: !item.productId,
      }));
      setLineItems(newLineItems);

      // Apply default settings
      if (selectedTemplate.defaultDiscountType) {
        setDiscountType(selectedTemplate.defaultDiscountType);
      }
      if (selectedTemplate.defaultDiscount !== null) {
        setDiscountValue(selectedTemplate.defaultDiscount);
      }
      if (selectedTemplate.defaultTaxRate !== null) {
        setTaxRate(selectedTemplate.defaultTaxRate * 100);
      }
      if (selectedTemplate.defaultValidDays) {
        setValue("validDays", selectedTemplate.defaultValidDays);
      }
      if (selectedTemplate.defaultTerms) {
        setTermsContent(selectedTemplate.defaultTerms);
      }
    }
  }, [selectedTemplate, setValue]);

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate discount amount
  const discountAmount = discountType === "percentage"
    ? (subtotal * discountValue) / 100
    : Math.min(discountValue, subtotal);

  // Calculate taxable amount and tax
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;

  // Calculate total
  const total = taxableAmount + taxAmount;

  const addLineItem = (product: { id: string; name: string; price: number }) => {
    // Store the product and open variant dialog
    // The dialog will check if variants exist and allow selection
    setPendingProduct(product);
    setVariantDialogOpen(true);
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const addLineItemDirect = (product: { id: string; name: string; price: number }) => {
    const existing = lineItems.find(
      (item) => item.productId === product.id && !item.variantId && !item.isCustom
    );
    if (existing) {
      setLineItems(
        lineItems.map((item) =>
          item.productId === product.id && !item.variantId && !item.isCustom
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setLineItems([
        ...lineItems,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
          isCustom: false,
        },
      ]);
    }
  };

  const addVariantLineItem = (variant: ProductVariant) => {
    if (!pendingProduct) return;

    const existing = lineItems.find(
      (item) => item.productId === pendingProduct.id && item.variantId === variant.id && !item.isCustom
    );

    if (existing) {
      setLineItems(
        lineItems.map((item) =>
          item.productId === pendingProduct.id && item.variantId === variant.id && !item.isCustom
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setLineItems([
        ...lineItems,
        {
          id: crypto.randomUUID(),
          productId: pendingProduct.id,
          variantId: variant.id,
          variantOptions: variant.options,
          productName: `${pendingProduct.name} - ${variant.name}`,
          sku: variant.sku,
          quantity: 1,
          price: variant.basePrice,
          isCustom: false,
        },
      ]);
    }
    setPendingProduct(null);
  };

  const handleVariantDialogClose = (open: boolean) => {
    if (!open) {
      // If dialog is closing without selection, add base product
      if (pendingProduct && !variantDialogOpen) {
        addLineItemDirect(pendingProduct);
      }
      setPendingProduct(null);
    }
    setVariantDialogOpen(open);
  };

  const addCustomItem = () => {
    if (!customItem.name || customItem.unitPrice <= 0) {
      return;
    }
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        productId: null,
        productName: customItem.name,
        description: customItem.description || undefined,
        sku: customItem.sku || null,
        quantity: customItem.quantity || 1,
        price: customItem.unitPrice,
        isCustom: true,
      },
    ]);
    // Reset custom item form
    setCustomItem({
      name: "",
      description: "",
      sku: "",
      quantity: 1,
      unitPrice: 0,
    });
    setItemInputMode("search"); // Switch back to search mode
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setLineItems(lineItems.filter((item) => item.id !== itemId));
    } else {
      setLineItems(
        lineItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const updatePrice = (itemId: string, price: number) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === itemId ? { ...item, price } : item
      )
    );
  };

  const removeLineItem = (itemId: string) => {
    setLineItems(lineItems.filter((item) => item.id !== itemId));
  };

  const selectCustomer = (customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    company?: string | null;
  }) => {
    const fullName = `${customer.firstName} ${customer.lastName}`;
    setSelectedCustomer({
      id: customer.id,
      name: fullName,
      email: customer.email,
    });
    setValue("customerId", customer.id);
    setValue("customerName", fullName);
    setValue("customerEmail", customer.email);
    if (customer.phone) setValue("customerPhone", customer.phone);
    if (customer.company) setValue("customerCompany", customer.company);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const onSubmit = async (data: QuotationFormData) => {
    if (lineItems.length === 0) {
      return;
    }

    // Use selected customer data if available, otherwise use manual input
    const customerName = selectedCustomer ? selectedCustomer.name : data.customerName;
    const customerEmail = selectedCustomer ? selectedCustomer.email : data.customerEmail;

    await createQuotation.mutateAsync({
      customerId: selectedCustomer?.id,
      customerName: customerName || "",
      customerEmail: customerEmail || "",
      customerPhone: data.customerPhone,
      customerCompany: data.customerCompany,
      validDays: data.validDays || 30,
      notes: data.notes,
      terms: termsContent || undefined,
      discountType: discountValue > 0 ? discountType : undefined,
      discountValue: discountValue > 0 ? discountValue : undefined,
      items: lineItems.map((item) => {
        if (item.isCustom) {
          // Custom item - no productId, send custom fields
          return {
            name: item.productName,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.price,
          };
        } else {
          // Product-based item (with optional variant)
          return {
            productId: item.productId!,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
            customPrice: item.price,
          };
        }
      }),
    });
    router.push("/quotations");
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Quotation</h1>
          <p className="text-muted-foreground">Create a new quotation for a customer</p>
        </div>
        {templates && templates.length > 0 && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedTemplateId || ""}
              onValueChange={(value) => setSelectedTemplateId(value || null)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Use template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={itemInputMode === "search" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setItemInputMode("search")}
                  >
                    <Package className="mr-1 h-4 w-4" />
                    Search Products
                  </Button>
                  <Button
                    type="button"
                    variant={itemInputMode === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setItemInputMode("custom")}
                  >
                    <PencilLine className="mr-1 h-4 w-4" />
                    Custom Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {itemInputMode === "search" ? (
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        placeholder="Search products to add..."
                        className="pl-10"
                      />
                    </div>
                    {showProductDropdown && productSearch && productsData?.data && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                        {productsData.data.length > 0 ? (
                          productsData.data.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              className="w-full px-4 py-2 text-left hover:bg-muted flex justify-between items-center"
                              onClick={() =>
                                addLineItem({
                                  id: product.id,
                                  name: product.name,
                                  price: product.basePrice,
                                })
                              }
                            >
                              <span>{product.name}</span>
                              <span className="text-muted-foreground">
                                {formatCurrency(product.basePrice)}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-muted-foreground">
                            No products found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Item Name *</Label>
                        <Input
                          value={customItem.name}
                          onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                          placeholder="Enter item name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input
                          value={customItem.sku}
                          onChange={(e) => setCustomItem({ ...customItem, sku: e.target.value })}
                          placeholder="Optional SKU"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={customItem.description}
                        onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })}
                        placeholder="Optional description"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Unit Price *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={customItem.unitPrice || ""}
                          onChange={(e) => setCustomItem({ ...customItem, unitPrice: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={customItem.quantity}
                          onChange={(e) => setCustomItem({ ...customItem, quantity: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={addCustomItem}
                          disabled={!customItem.name || customItem.unitPrice <= 0}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {lineItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items added yet. Search for products or add custom items above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
                      <div className="col-span-5">Product</div>
                      <div className="col-span-2">Price</div>
                      <div className="col-span-2">Qty</div>
                      <div className="col-span-2 text-right">Total</div>
                      <div className="col-span-1"></div>
                    </div>
                    {lineItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-2 items-center p-2 border rounded-lg"
                      >
                        <div className="col-span-5">
                          <div className="font-medium truncate flex items-center gap-2">
                            <span className="truncate">{item.productName}</span>
                            {item.isCustom && (
                              <Badge variant="secondary" className="shrink-0">
                                Custom
                              </Badge>
                            )}
                            {item.variantId && (
                              <Badge variant="outline" className="shrink-0">
                                Variant
                              </Badge>
                            )}
                          </div>
                          {item.variantOptions && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatVariantOptions(item.variantOptions)}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              updatePrice(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.id,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-8"
                            min="1"
                          />
                        </div>
                        <div className="col-span-2 text-right font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-4 border-t">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Subtotal</div>
                        <div className="text-xl font-bold">
                          {formatCurrency(subtotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Internal notes (visible on PDF)..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <TermsEditor
                  content={termsContent}
                  onChange={setTermsContent}
                  placeholder="Enter terms and conditions or load a template..."
                  minHeight={150}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Use the toolbar to format text or load a pre-defined template
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCustomer ? (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <div className="font-medium">{selectedCustomer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedCustomer.email}
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-1"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setValue("customerId", undefined);
                        setValue("customerName", "");
                        setValue("customerEmail", "");
                        setValue("customerPhone", "");
                        setValue("customerCompany", "");
                      }}
                    >
                      Change customer
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Input
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder="Search existing customers..."
                      />
                      {showCustomerDropdown &&
                        customerSearch &&
                        customersData?.data && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                            {customersData.data.length > 0 ? (
                              customersData.data.map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  className="w-full px-4 py-2 text-left hover:bg-muted"
                                  onClick={() => selectCustomer(customer)}
                                >
                                  <div className="font-medium">
                                    {customer.firstName} {customer.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {customer.email}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-muted-foreground">
                                No customers found
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-border"></div>
                      <span className="mx-4 text-sm text-muted-foreground">or enter manually</span>
                      <div className="flex-grow border-t border-border"></div>
                    </div>

                    <div className="space-y-2">
                      <Label>Customer Name *</Label>
                      <Input {...register("customerName")} placeholder="John Doe" />
                      {errors.customerName && (
                        <p className="text-sm text-destructive">
                          {errors.customerName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Email *</Label>
                      <Input
                        {...register("customerEmail")}
                        type="email"
                        placeholder="john@example.com"
                      />
                      {errors.customerEmail && (
                        <p className="text-sm text-destructive">
                          {errors.customerEmail.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        {...register("customerPhone")}
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        {...register("customerCompany")}
                        placeholder="Company name"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing Adjustments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Discount</Label>
                  <div className="flex gap-2">
                    <Select
                      value={discountType}
                      onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          <div className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Percent
                          </div>
                        </SelectItem>
                        <SelectItem value="fixed">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Fixed
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={discountType === "percentage" ? 1 : 0.01}
                      max={discountType === "percentage" ? 100 : undefined}
                      placeholder={discountType === "percentage" ? "0%" : "$0.00"}
                      className="flex-1"
                    />
                  </div>
                  {discountAmount > 0 && (
                    <p className="text-sm text-green-600">
                      -{formatCurrency(discountAmount)} discount applied
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tax is calculated on the amount after discount
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Valid for (days)</Label>
                  <Input
                    {...register("validDays", { valueAsNumber: true })}
                    type="number"
                    min={1}
                    max={365}
                    placeholder="30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Quotation will expire after this many days (default: 30)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{lineItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || lineItems.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Quotation
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Variant Selector Dialog */}
      {pendingProduct && (
        <VariantSelector
          open={variantDialogOpen}
          onOpenChange={handleVariantDialogClose}
          productId={pendingProduct.id}
          productName={pendingProduct.name}
          onSelect={addVariantLineItem}
          onSkip={() => {
            if (pendingProduct) {
              addLineItemDirect(pendingProduct);
            }
          }}
        />
      )}
    </div>
  );
}
