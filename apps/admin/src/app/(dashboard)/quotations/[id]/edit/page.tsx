"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useQuotation, useUpdateQuotation } from "@/hooks/use-quotations";
import { useProducts } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";

const quotationSchema = z.object({
  validUntil: z.string().optional(),
  notes: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: quotation, isLoading: isLoadingQuotation } = useQuotation(id);
  const updateQuotation = useUpdateQuotation();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const { data: productsData } = useProducts({ search: productSearch, limit: 10 });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
  });

  useEffect(() => {
    if (quotation) {
      reset({
        validUntil: quotation.validUntil
          ? new Date(quotation.validUntil).toISOString().split("T")[0]
          : "",
        notes: quotation.notes || "",
      });
      setLineItems(
        quotation.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        }))
      );
    }
  }, [quotation, reset]);

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const addLineItem = (product: { id: string; name: string; price: number }) => {
    const existing = lineItems.find((item) => item.productId === product.id);
    if (existing) {
      setLineItems(
        lineItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setLineItems([
        ...lineItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
        },
      ]);
    }
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setLineItems(lineItems.filter((item) => item.productId !== productId));
    } else {
      setLineItems(
        lineItems.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const updatePrice = (productId: string, price: number) => {
    setLineItems(
      lineItems.map((item) =>
        item.productId === productId ? { ...item, price } : item
      )
    );
  };

  const removeLineItem = (productId: string) => {
    setLineItems(lineItems.filter((item) => item.productId !== productId));
  };

  const onSubmit = async (data: QuotationFormData) => {
    if (lineItems.length === 0) {
      return;
    }

    await updateQuotation.mutateAsync({
      id,
      data: {
        ...data,
        items: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    });
    router.push(`/quotations/${id}`);
  };

  if (isLoadingQuotation) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quotation) {
    return <div>Quotation not found</div>;
  }

  if (quotation.status !== "draft") {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Only draft quotations can be edited.
          </p>
          <Button className="mt-4" onClick={() => router.push(`/quotations/${id}`)}>
            View Quotation
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Edit {quotation.quotationNumber}
          </h1>
          <p className="text-muted-foreground">Update quotation details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {lineItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items added yet. Search for products above.
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
                        key={item.productId}
                        className="grid grid-cols-12 gap-2 items-center p-2 border rounded-lg"
                      >
                        <div className="col-span-5 font-medium truncate">
                          {item.productName}
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              updatePrice(
                                item.productId,
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
                                item.productId,
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
                            onClick={() => removeLineItem(item.productId)}
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
                  rows={4}
                  placeholder="Add any notes or terms for this quotation..."
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    {...register("validUntil")}
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                  />
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
                <div className="flex justify-between pt-2 border-t font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || lineItems.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
