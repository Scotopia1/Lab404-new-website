"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Package,
  MapPin,
  Truck,
  FileText,
  Eye,
  User,
  CreditCard,
  Settings,
  Download,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useOrder,
  useUpdateOrder,
  OrderStatus,
  PaymentStatus,
  OrderAddress,
} from "@/hooks/use-orders";
import {
  useCustomerAddresses,
  useAddCustomerAddress,
  useUpdateCustomerAddress,
  CustomerAddress,
  AddressInput,
} from "@/hooks/use-customers";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Plus, Save } from "lucide-react";

// Validation Schema
const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  company: z.string().max(255).optional().or(z.literal("")),
  addressLine1: z.string().min(1, "Address is required").max(255),
  addressLine2: z.string().max(255).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  country: z.string().min(1, "Country is required").max(100),
  phone: z.string().max(50).optional().or(z.literal("")),
});

// Make billing address fields optional since we sync from shipping when sameAsShipping is true
const optionalAddressSchema = z.object({
  firstName: z.string().max(100).optional().or(z.literal("")),
  lastName: z.string().max(100).optional().or(z.literal("")),
  company: z.string().max(255).optional().or(z.literal("")),
  addressLine1: z.string().max(255).optional().or(z.literal("")),
  addressLine2: z.string().max(255).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
});

const orderEditSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  paymentStatus: z.enum(["pending", "paid", "refunded", "failed"]),
  shippingMethod: z.string().max(100).optional().or(z.literal("")),
  trackingNumber: z.string().max(255).optional().or(z.literal("")),
  adminNotes: z.string().max(1000).optional().or(z.literal("")),
  shippingAddress: addressSchema,
  billingAddress: optionalAddressSchema,
  sameAsShipping: z.boolean(),
});

type OrderEditFormData = z.infer<typeof orderEditSchema>;

// FormSection Component
function FormSection({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  {description && (
                    <CardDescription>{description}</CardDescription>
                  )}
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

const COUNTRIES = [
  "Lebanon",
  "United Arab Emirates",
  "Saudi Arabia",
  "Kuwait",
  "Qatar",
  "Bahrain",
  "Oman",
  "Jordan",
  "Egypt",
  "Iraq",
  "Syria",
  "Other",
];

// Address Form Fields Component with Customer Address Selection
function AddressFieldsWithSelector({
  prefix,
  register,
  errors,
  disabled = false,
  customerId,
  setValue,
  watch,
  addAddress,
  updateAddress,
}: {
  prefix: "shippingAddress" | "billingAddress";
  register: ReturnType<typeof useForm<OrderEditFormData>>["register"];
  errors: ReturnType<typeof useForm<OrderEditFormData>>["formState"]["errors"];
  disabled?: boolean;
  customerId?: string | null;
  setValue: ReturnType<typeof useForm<OrderEditFormData>>["setValue"];
  watch: ReturnType<typeof useForm<OrderEditFormData>>["watch"];
  addAddress: ReturnType<typeof useAddCustomerAddress>;
  updateAddress: ReturnType<typeof useUpdateCustomerAddress>;
}) {
  const fieldErrors = errors[prefix];
  const addressType = prefix === "shippingAddress" ? "shipping" : "billing";

  const { data: addresses, isLoading: addressesLoading } = useCustomerAddresses(customerId || null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter addresses by type
  const filteredAddresses = addresses?.filter(addr => addr.type === addressType) || [];

  const handleSelectAddress = (addressId: string) => {
    const address = filteredAddresses.find(a => a.id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setValue(`${prefix}.firstName`, address.firstName);
      setValue(`${prefix}.lastName`, address.lastName);
      setValue(`${prefix}.company`, address.company || "");
      setValue(`${prefix}.addressLine1`, address.addressLine1);
      setValue(`${prefix}.addressLine2`, address.addressLine2 || "");
      setValue(`${prefix}.city`, address.city);
      setValue(`${prefix}.state`, address.state || "");
      setValue(`${prefix}.postalCode`, address.postalCode || "");
      setValue(`${prefix}.country`, address.country);
      setValue(`${prefix}.phone`, address.phone || "");
    }
  };

  const handleSaveToCustomer = async () => {
    if (!customerId) return;

    const currentAddress = watch(prefix);
    if (!currentAddress.firstName || !currentAddress.addressLine1 || !currentAddress.city || !currentAddress.country) {
      toast.error("Please fill in required fields before saving");
      return;
    }

    setIsSaving(true);
    try {
      const addressInput: AddressInput = {
        type: addressType,
        firstName: currentAddress.firstName || "",
        lastName: currentAddress.lastName || "",
        company: currentAddress.company || undefined,
        addressLine1: currentAddress.addressLine1 || "",
        addressLine2: currentAddress.addressLine2 || undefined,
        city: currentAddress.city || "",
        state: currentAddress.state || undefined,
        postalCode: currentAddress.postalCode || undefined,
        country: currentAddress.country || "",
        phone: currentAddress.phone || undefined,
        isDefault: filteredAddresses.length === 0,
      };

      if (selectedAddressId) {
        // Update existing address
        await updateAddress.mutateAsync({
          customerId,
          addressId: selectedAddressId,
          data: addressInput,
        });
        toast.success("Address updated in customer account");
      } else {
        // Add new address
        const newAddress = await addAddress.mutateAsync({
          customerId,
          data: addressInput,
        });
        setSelectedAddressId(newAddress.id);
        toast.success("Address saved to customer account");
      }
    } catch {
      // Error is handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Customer Address Selector */}
      {customerId && (
        <div className="flex items-end gap-2 pb-4 border-b">
          <div className="flex-1 space-y-2">
            <Label>Select from saved addresses</Label>
            {addressesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading addresses...
              </div>
            ) : filteredAddresses.length > 0 ? (
              <Select
                value={selectedAddressId || ""}
                onValueChange={handleSelectAddress}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an address to auto-fill" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAddresses.map((addr) => (
                    <SelectItem key={addr.id} value={addr.id}>
                      {addr.firstName} {addr.lastName} - {addr.addressLine1}, {addr.city}
                      {addr.isDefault && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                No saved {addressType} addresses
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveToCustomer}
            disabled={isSaving || !customerId}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {selectedAddressId ? "Update" : "Save New"}
          </Button>
        </div>
      )}

      {/* Address Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}.firstName`}>First Name *</Label>
          <Input
            id={`${prefix}.firstName`}
            {...register(`${prefix}.firstName`)}
            disabled={disabled}
          />
          {fieldErrors?.firstName && (
            <p className="text-sm text-destructive">{fieldErrors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}.lastName`}>Last Name *</Label>
          <Input
            id={`${prefix}.lastName`}
            {...register(`${prefix}.lastName`)}
            disabled={disabled}
          />
          {fieldErrors?.lastName && (
            <p className="text-sm text-destructive">{fieldErrors.lastName.message}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${prefix}.company`}>Company</Label>
          <Input
            id={`${prefix}.company`}
            {...register(`${prefix}.company`)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${prefix}.addressLine1`}>Address Line 1 *</Label>
          <Input
            id={`${prefix}.addressLine1`}
            {...register(`${prefix}.addressLine1`)}
            disabled={disabled}
          />
          {fieldErrors?.addressLine1 && (
            <p className="text-sm text-destructive">{fieldErrors.addressLine1.message}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${prefix}.addressLine2`}>Address Line 2</Label>
          <Input
            id={`${prefix}.addressLine2`}
            {...register(`${prefix}.addressLine2`)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}.city`}>City *</Label>
          <Input
            id={`${prefix}.city`}
            {...register(`${prefix}.city`)}
            disabled={disabled}
          />
          {fieldErrors?.city && (
            <p className="text-sm text-destructive">{fieldErrors.city.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}.state`}>State/Province</Label>
          <Input
            id={`${prefix}.state`}
            {...register(`${prefix}.state`)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}.postalCode`}>Postal Code</Label>
          <Input
            id={`${prefix}.postalCode`}
            {...register(`${prefix}.postalCode`)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}.country`}>Country *</Label>
          <Select
            value={watch(`${prefix}.country`) || ""}
            onValueChange={(value) => setValue(`${prefix}.country`, value)}
            disabled={disabled}
          >
            <SelectTrigger id={`${prefix}.country`}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors?.country && (
            <p className="text-sm text-destructive">{fieldErrors.country.message}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${prefix}.phone`}>Phone</Label>
          <Input
            id={`${prefix}.phone`}
            {...register(`${prefix}.phone`)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: order, isLoading: orderLoading } = useOrder(id);
  const updateOrder = useUpdateOrder();
  const addAddress = useAddCustomerAddress();
  const updateCustomerAddress = useUpdateCustomerAddress();

  const [formInitialized, setFormInitialized] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<OrderEditFormData | null>(null);

  const downloadInvoice = async () => {
    if (!order) return;

    setIsDownloading(true);
    try {
      const response = await api.get(`/orders/${id}/invoice`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully');
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setIsDownloading(false);
    }
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrderEditFormData>({
    resolver: zodResolver(orderEditSchema),
    defaultValues: {
      status: "pending",
      paymentStatus: "pending",
      shippingMethod: "",
      trackingNumber: "",
      adminNotes: "",
      sameAsShipping: true,
      shippingAddress: {
        firstName: "",
        lastName: "",
        company: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        phone: "",
      },
      billingAddress: {
        firstName: "",
        lastName: "",
        company: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        phone: "",
      },
    },
  });

  const sameAsShipping = watch("sameAsShipping");
  const shippingAddress = watch("shippingAddress");

  // Load order data into form
  useEffect(() => {
    if (order) {
      const isSame =
        order.billingAddress &&
        JSON.stringify(order.shippingAddress) === JSON.stringify(order.billingAddress);

      reset({
        status: order.status,
        paymentStatus: order.paymentStatus,
        shippingMethod: order.shippingMethod || "",
        trackingNumber: order.trackingNumber || "",
        adminNotes: order.adminNotes || "",
        sameAsShipping: isSame ?? true,
        shippingAddress: {
          firstName: order.shippingAddress.firstName || "",
          lastName: order.shippingAddress.lastName || "",
          company: order.shippingAddress.company || "",
          addressLine1: order.shippingAddress.addressLine1 || "",
          addressLine2: order.shippingAddress.addressLine2 || "",
          city: order.shippingAddress.city || "",
          state: order.shippingAddress.state || "",
          postalCode: order.shippingAddress.postalCode || "",
          country: order.shippingAddress.country || "",
          phone: order.shippingAddress.phone || "",
        },
        billingAddress: order.billingAddress
          ? {
              firstName: order.billingAddress.firstName || "",
              lastName: order.billingAddress.lastName || "",
              company: order.billingAddress.company || "",
              addressLine1: order.billingAddress.addressLine1 || "",
              addressLine2: order.billingAddress.addressLine2 || "",
              city: order.billingAddress.city || "",
              state: order.billingAddress.state || "",
              postalCode: order.billingAddress.postalCode || "",
              country: order.billingAddress.country || "",
              phone: order.billingAddress.phone || "",
            }
          : {
              firstName: order.shippingAddress.firstName || "",
              lastName: order.shippingAddress.lastName || "",
              company: order.shippingAddress.company || "",
              addressLine1: order.shippingAddress.addressLine1 || "",
              addressLine2: order.shippingAddress.addressLine2 || "",
              city: order.shippingAddress.city || "",
              state: order.shippingAddress.state || "",
              postalCode: order.shippingAddress.postalCode || "",
              country: order.shippingAddress.country || "",
              phone: order.shippingAddress.phone || "",
            },
      });
      setFormInitialized(true);
    }
  }, [order, reset]);

  // Sync billing address when sameAsShipping is checked
  useEffect(() => {
    if (sameAsShipping && shippingAddress) {
      setValue("billingAddress", shippingAddress);
    }
  }, [sameAsShipping, shippingAddress, setValue]);

  // Watch current status and tracking number for warnings
  const currentStatus = watch("status");
  const currentTrackingNumber = watch("trackingNumber");

  const onSubmit = async (data: OrderEditFormData) => {
    // Show confirmation for cancelling orders
    if (data.status === "cancelled" && order?.status !== "cancelled") {
      setPendingSubmitData(data);
      setShowCancelConfirm(true);
      return;
    }

    await performSubmit(data);
  };

  const performSubmit = async (data: OrderEditFormData) => {
    try {
      // Build shipping address
      const shippingAddr = {
        firstName: data.shippingAddress.firstName,
        lastName: data.shippingAddress.lastName,
        addressLine1: data.shippingAddress.addressLine1,
        city: data.shippingAddress.city,
        country: data.shippingAddress.country,
        company: data.shippingAddress.company || undefined,
        addressLine2: data.shippingAddress.addressLine2 || undefined,
        state: data.shippingAddress.state || undefined,
        postalCode: data.shippingAddress.postalCode || undefined,
        phone: data.shippingAddress.phone || undefined,
      };

      // Build billing address (use shipping if sameAsShipping)
      const billingAddr = data.sameAsShipping
        ? shippingAddr
        : {
            firstName: data.billingAddress?.firstName || data.shippingAddress.firstName,
            lastName: data.billingAddress?.lastName || data.shippingAddress.lastName,
            addressLine1: data.billingAddress?.addressLine1 || data.shippingAddress.addressLine1,
            city: data.billingAddress?.city || data.shippingAddress.city,
            country: data.billingAddress?.country || data.shippingAddress.country,
            company: data.billingAddress?.company || undefined,
            addressLine2: data.billingAddress?.addressLine2 || undefined,
            state: data.billingAddress?.state || undefined,
            postalCode: data.billingAddress?.postalCode || undefined,
            phone: data.billingAddress?.phone || undefined,
          };

      const submitData = {
        status: data.status,
        paymentStatus: data.paymentStatus,
        shippingMethod: data.shippingMethod || undefined,
        trackingNumber: data.trackingNumber || undefined,
        adminNotes: data.adminNotes || undefined,
        shippingAddress: shippingAddr,
        billingAddress: billingAddr,
      };

      await updateOrder.mutateAsync({ id, data: submitData });
      router.push(`/orders/${id}`);
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error("Failed to update order:", error);
    }
  };

  const handleConfirmCancel = async () => {
    if (pendingSubmitData) {
      await performSubmit(pendingSubmitData);
      setPendingSubmitData(null);
    }
    setShowCancelConfirm(false);
  };

  // Check for warnings
  const warnings: string[] = [];
  if (currentStatus === "shipped" && !currentTrackingNumber) {
    warnings.push("Setting status to 'Shipped' without a tracking number");
  }
  if (currentStatus === "delivered" && order?.status !== "shipped") {
    warnings.push("Setting status to 'Delivered' when order hasn't been marked as shipped");
  }

  // Check for validation errors
  const hasErrors = Object.keys(errors).length > 0;

  if (orderLoading || !formInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Order not found</h2>
        <Button asChild className="mt-4">
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Edit Order #{order.orderNumber}
          </h1>
          <p className="text-muted-foreground">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadInvoice} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download Invoice
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/orders/${id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Validation Errors Alert */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            Please fix the following errors before saving:
            <ul className="mt-2 list-disc list-inside text-sm">
              {errors.status && <li>Status: {errors.status.message}</li>}
              {errors.paymentStatus && <li>Payment Status: {errors.paymentStatus.message}</li>}
              {errors.shippingAddress?.firstName && (
                <li>Shipping Address: First name is required</li>
              )}
              {errors.shippingAddress?.lastName && (
                <li>Shipping Address: Last name is required</li>
              )}
              {errors.shippingAddress?.addressLine1 && (
                <li>Shipping Address: Address is required</li>
              )}
              {errors.shippingAddress?.city && (
                <li>Shipping Address: City is required</li>
              )}
              {errors.shippingAddress?.country && (
                <li>Shipping Address: Country is required</li>
              )}
              {errors.root && <li>{errors.root.message}</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings Alert */}
      {warnings.length > 0 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">Warnings</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            <ul className="mt-1 list-disc list-inside text-sm">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Cancelled Status Warning */}
      {currentStatus === "cancelled" && order?.status !== "cancelled" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning: Cancelling Order</AlertTitle>
          <AlertDescription>
            You are about to cancel this order. This action will require confirmation.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Editable Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Section */}
            <FormSection
              title="Order Status"
              description="Update order and payment status"
              icon={Settings}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Order Status</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Controller
                    control={control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </FormSection>

            {/* Shipping & Tracking Section */}
            <FormSection
              title="Shipping & Tracking"
              description="Shipping method and tracking information"
              icon={Truck}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shippingMethod">Shipping Method</Label>
                  <Input
                    id="shippingMethod"
                    placeholder="e.g., Standard, Express, Overnight"
                    {...register("shippingMethod")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input
                    id="trackingNumber"
                    placeholder="Enter tracking number"
                    {...register("trackingNumber")}
                  />
                </div>
              </div>
            </FormSection>

            {/* Shipping Address Section */}
            <FormSection
              title="Shipping Address"
              description="Customer's shipping address"
              icon={MapPin}
            >
              <AddressFieldsWithSelector
                prefix="shippingAddress"
                register={register}
                errors={errors}
                customerId={order.customer?.id}
                setValue={setValue}
                watch={watch}
                addAddress={addAddress}
                updateAddress={updateCustomerAddress}
              />
            </FormSection>

            {/* Billing Address Section */}
            <FormSection
              title="Billing Address"
              description="Customer's billing address"
              icon={CreditCard}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name="sameAsShipping"
                    render={({ field }) => (
                      <Checkbox
                        id="sameAsShipping"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="sameAsShipping" className="cursor-pointer">
                    Same as shipping address
                  </Label>
                </div>
                {!sameAsShipping && (
                  <AddressFieldsWithSelector
                    prefix="billingAddress"
                    register={register}
                    errors={errors}
                    customerId={order.customer?.id}
                    setValue={setValue}
                    watch={watch}
                    addAddress={addAddress}
                    updateAddress={updateCustomerAddress}
                  />
                )}
              </div>
            </FormSection>

            {/* Admin Notes Section */}
            <FormSection
              title="Admin Notes"
              description="Internal notes (not visible to customer)"
              icon={FileText}
            >
              <div className="space-y-2">
                <Textarea
                  id="adminNotes"
                  placeholder="Add internal notes about this order..."
                  rows={4}
                  {...register("adminNotes")}
                />
                <p className="text-xs text-muted-foreground">
                  {(watch("adminNotes") || "").length}/1000 characters
                </p>
              </div>
            </FormSection>

            {/* Order Items (Read-Only) */}
            <FormSection
              title="Order Items"
              description="Items in this order (read-only)"
              icon={Package}
              defaultOpen={false}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-right text-sm text-muted-foreground">
                <p>Subtotal: {formatCurrency(order.subtotal)}</p>
                {order.discount > 0 && (
                  <p className="text-green-600">Discount: -{formatCurrency(order.discount)}</p>
                )}
                <p>Shipping: {formatCurrency(order.shipping)}</p>
                <p>Tax: {formatCurrency(order.tax)}</p>
                <p className="font-bold text-foreground text-lg">
                  Total: {formatCurrency(order.total)}
                </p>
              </div>
            </FormSection>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Current Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Order Status</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Status</span>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </CardContent>
            </Card>

            {/* Customer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {order.customer ? (
                  <>
                    <p className="font-medium">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                    <p className="text-muted-foreground">{order.customer.email}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground italic">Guest Order</p>
                )}
              </CardContent>
            </Card>

            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-mono">#{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{order.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Notes Card (if exists) */}
            {order.customerNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Customer Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-muted p-3 rounded">{order.customerNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background border-t mt-6 py-4 -mx-6 px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isDirty ? (
                <span className="text-yellow-600 dark:text-yellow-400">
                  • Unsaved changes
                </span>
              ) : (
                <span>No changes</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href={`/orders/${id}`}>Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || updateOrder.isPending}
              >
                {(isSubmitting || updateOrder.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancel Order #{order?.orderNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action will mark the
              order as cancelled and may affect inventory and reporting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSubmitData(null)}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {updateOrder.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
