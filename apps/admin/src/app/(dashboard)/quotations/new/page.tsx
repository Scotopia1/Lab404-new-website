"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useCreateQuotation } from "@/hooks/use-quotations";
import { useProducts } from "@/hooks/use-products";
import { useCustomers } from "@/hooks/use-customers";
import { formatCurrency } from "@/lib/utils";

const quotationSchema = z.object({
  customerId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
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

export default function NewQuotationPage() {
  const router = useRouter();
  const createQuotation = useCreateQuotation();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const { data: productsData } = useProducts({ search: productSearch, limit: 10 });
  const { data: customersData } = useCustomers({ search: customerSearch, limit: 10 });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
  });

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

  const selectCustomer = (customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }) => {
    setSelectedCustomer({
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
    });
    setValue("customerId", customer.id);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const onSubmit = async (data: QuotationFormData) => {
    if (lineItems.length === 0) {
      return;
    }

    await createQuotation.mutateAsync({
      ...data,
      customerId: selectedCustomer?.id,
      items: lineItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    });
    router.push("/quotations");
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-foreground">New Quotation</h1>
        <p className="text-muted-foreground">Create a new quotation for a customer</p>
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
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCustomer ? (
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">{selectedCustomer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedCustomer.email}
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-1"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Change customer
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search customers..."
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
                )}

                <div className="text-sm text-muted-foreground">
                  Or enter customer details manually:
                </div>
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input {...register("customerName")} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Customer Email</Label>
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
              </CardContent>
            </Card>

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
            Create Quotation
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
