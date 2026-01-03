"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2, Search, Package, User, CreditCard, FileText, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AddressSelector } from "@/components/orders/AddressSelector";
import { useCreateOrder, OrderAddress } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { useCustomers } from "@/hooks/use-customers";
import { formatCurrency } from "@/lib/utils";

const orderFormSchema = z.object({
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerFirstName: z.string().optional(),
  customerLastName: z.string().optional(),
  customerPhone: z.string().optional(),
  paymentMethod: z.enum(["cod", "bank_transfer", "cash"]),
  paymentStatus: z.enum(["pending", "paid"]),
  promoCode: z.string().optional(),
  adminNotes: z.string().optional(),
  customerNotes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface LineItem {
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  price: number;
  stock: number;
}

interface SelectedCustomer {
  id: string;
  name: string;
  email: string;
}

const TAX_RATE = 0.11; // 11% tax

export default function NewOrderPage() {
  const router = useRouter();
  const createOrder = useCreateOrder();

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Customer state
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Discount state
  const [manualDiscount, setManualDiscount] = useState(0);

  // Address state
  const [shippingAddress, setShippingAddress] = useState<OrderAddress>({
    firstName: "",
    lastName: "",
    company: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Lebanon",
    phone: "",
  });
  const [billingAddress, setBillingAddress] = useState<OrderAddress>({
    firstName: "",
    lastName: "",
    company: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Lebanon",
    phone: "",
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Data fetching
  const { data: productsData } = useProducts({
    search: productSearch || undefined,
    limit: 10
  });
  const { data: customersData } = useCustomers({
    search: customerSearch || undefined,
    limit: 10
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      paymentMethod: "cod",
      paymentStatus: "pending",
    },
  });

  // Calculate totals
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const effectiveDiscount = Math.min(manualDiscount, subtotal);
  const taxableAmount = subtotal - effectiveDiscount;
  const tax = taxableAmount * TAX_RATE;
  const total = taxableAmount + tax;

  // Product functions
  const addLineItem = (product: {
    id: string;
    name: string;
    basePrice: number;
    sku: string | null;
    stockQuantity: number;
  }) => {
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
          sku: product.sku,
          quantity: 1,
          price: product.basePrice,
          stock: product.stockQuantity,
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

  const removeLineItem = (productId: string) => {
    setLineItems(lineItems.filter((item) => item.productId !== productId));
  };

  // Customer functions
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
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const onSubmit = async (data: OrderFormData) => {
    const errors: string[] = [];

    // Validate items
    if (lineItems.length === 0) {
      errors.push("At least one product is required");
    }

    // Must have either selected customer or email
    if (!selectedCustomer && !data.customerEmail) {
      errors.push("Please select a customer or enter a customer email");
    }

    // Validate shipping address
    if (!shippingAddress.firstName) {
      errors.push("Shipping address: First name is required");
    }
    if (!shippingAddress.lastName) {
      errors.push("Shipping address: Last name is required");
    }
    if (!shippingAddress.addressLine1) {
      errors.push("Shipping address: Address is required");
    }
    if (!shippingAddress.city) {
      errors.push("Shipping address: City is required");
    }
    if (!shippingAddress.country) {
      errors.push("Shipping address: Country is required");
    }

    // Validate billing address if not same as shipping
    if (!sameAsShipping) {
      if (!billingAddress.firstName) {
        errors.push("Billing address: First name is required");
      }
      if (!billingAddress.lastName) {
        errors.push("Billing address: Last name is required");
      }
      if (!billingAddress.addressLine1) {
        errors.push("Billing address: Address is required");
      }
      if (!billingAddress.city) {
        errors.push("Billing address: City is required");
      }
      if (!billingAddress.country) {
        errors.push("Billing address: Country is required");
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Clear errors on successful validation
    setValidationErrors([]);

    const orderData = {
      customerId: selectedCustomer?.id,
      customerEmail: selectedCustomer ? undefined : data.customerEmail || undefined,
      customerFirstName: data.customerFirstName || undefined,
      customerLastName: data.customerLastName || undefined,
      customerPhone: data.customerPhone || undefined,
      items: lineItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      shippingAddress: shippingAddress,
      billingAddress: sameAsShipping ? undefined : billingAddress,
      sameAsShipping: sameAsShipping,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      promoCode: data.promoCode || undefined,
      manualDiscount: manualDiscount > 0 ? manualDiscount : undefined,
      adminNotes: data.adminNotes || undefined,
      customerNotes: data.customerNotes || undefined,
    };

    const result = await createOrder.mutateAsync(orderData);
    if (result) {
      router.push(`/orders/${result.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Order</h1>
          <p className="text-muted-foreground">Create a new order manually</p>
        </div>
      </div>

      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Please fix the following errors</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc list-inside text-sm">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCustomer ? (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="font-medium">{selectedCustomer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedCustomer.email}
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-2"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Change customer
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative" ref={customerDropdownRef}>
                      <Label className="mb-2 block">Search Existing Customer</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDropdown(true);
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          placeholder="Search by name or email..."
                          className="pl-10"
                        />
                      </div>
                      {showCustomerDropdown && customersData?.data && (
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

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or enter new customer
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          {...register("customerEmail")}
                          type="email"
                          placeholder="customer@example.com"
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
                          placeholder="+961 XX XXX XXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          {...register("customerFirstName")}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          {...register("customerLastName")}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Order Items Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative" ref={productDropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  {showProductDropdown && productsData?.data && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {productsData.data.length > 0 ? (
                        productsData.data.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-muted flex justify-between items-center"
                            onClick={() => addLineItem(product)}
                          >
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.sku || "No SKU"} | Stock: {product.stockQuantity}
                              </div>
                            </div>
                            <span className="font-medium">
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
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
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
                        className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg"
                      >
                        <div className="col-span-5">
                          <div className="font-medium truncate">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.sku || "No SKU"}
                          </div>
                        </div>
                        <div className="col-span-2 text-sm">
                          {formatCurrency(item.price)}
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
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <AddressSelector
              customerId={selectedCustomer?.id || null}
              label="Shipping"
              addressData={shippingAddress}
              onAddressChange={setShippingAddress}
              isGuest={!selectedCustomer}
            />

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAsShipping"
                    checked={sameAsShipping}
                    onCheckedChange={(checked) =>
                      setSameAsShipping(checked as boolean)
                    }
                  />
                  <Label htmlFor="sameAsShipping" className="cursor-pointer">
                    Same as shipping address
                  </Label>
                </div>
              </CardContent>
            </Card>

            {!sameAsShipping && (
              <AddressSelector
                customerId={selectedCustomer?.id || null}
                label="Billing"
                addressData={billingAddress}
                onAddressChange={setBillingAddress}
                isGuest={!selectedCustomer}
              />
            )}

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Admin Notes (Internal)</Label>
                  <Textarea
                    {...register("adminNotes")}
                    rows={3}
                    placeholder="Internal notes about this order..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Notes</Label>
                  <Textarea
                    {...register("customerNotes")}
                    rows={3}
                    placeholder="Notes from the customer..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{lineItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(effectiveDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (11%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    defaultValue="cod"
                    onValueChange={(value) =>
                      setValue("paymentMethod", value as "cod" | "bank_transfer" | "cash")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    defaultValue="pending"
                    onValueChange={(value) =>
                      setValue("paymentStatus", value as "pending" | "paid")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Discounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Discounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Promo Code</Label>
                  <Input
                    {...register("promoCode")}
                    placeholder="Enter promo code"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manual Discount ($)</Label>
                  <Input
                    type="number"
                    value={manualDiscount}
                    onChange={(e) => setManualDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional discount amount
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 sticky bottom-0 bg-background py-4 border-t -mx-6 px-6">
          <Button
            type="submit"
            disabled={isSubmitting || lineItems.length === 0 || (!selectedCustomer && !watch("customerEmail"))}
            size="lg"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Order
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
