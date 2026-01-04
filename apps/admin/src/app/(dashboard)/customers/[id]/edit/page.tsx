"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Tag,
  FileText,
  MapPin,
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useCustomer,
  useUpdateCustomer,
  useCustomerAddresses,
  useAddCustomerAddress,
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
  CustomerAddress,
  AddressInput,
} from "@/hooks/use-customers";
import { formatCurrency, formatDate } from "@/lib/utils";

const customerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  firstName: z
    .string()
    .max(100, "First name must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
  lastName: z
    .string()
    .max(100, "Last name must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
  phone: z
    .string()
    .max(50, "Phone number must be less than 50 characters")
    .optional()
    .transform((val) => val?.trim() || undefined)
    .refine(
      (val) => !val || /^[+]?[\d\s\-().]+$/.test(val),
      "Please enter a valid phone number"
    ),
  isGuest: z.boolean(),
  isActive: z.boolean(),
  acceptsMarketing: z.boolean(),
  notes: z
    .string()
    .max(5000, "Notes must be less than 5000 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
  tags: z.array(
    z.string().max(50, "Each tag must be less than 50 characters")
  ),
});

type CustomerFormData = z.infer<typeof customerSchema>;

function FormSection({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = true,
  action,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  action?: React.ReactNode;
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
              <div className="flex items-center gap-2">
                {action && (
                  <div onClick={(e) => e.stopPropagation()}>{action}</div>
                )}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
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

const tagSuggestions = [
  "vip",
  "wholesale",
  "retail",
  "new",
  "returning",
  "b2b",
  "b2c",
  "priority",
  "loyalty",
];

interface AddressFormState {
  isOpen: boolean;
  mode: "add" | "edit";
  addressId?: string;
  type: "shipping" | "billing";
  data: AddressInput;
}

const emptyAddress: AddressInput = {
  type: "shipping",
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
  isDefault: false,
};

// Address validation helper
function validateAddress(data: AddressInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.firstName?.trim()) {
    errors.firstName = "First name is required";
  } else if (data.firstName.length > 100) {
    errors.firstName = "First name must be less than 100 characters";
  }

  if (!data.lastName?.trim()) {
    errors.lastName = "Last name is required";
  } else if (data.lastName.length > 100) {
    errors.lastName = "Last name must be less than 100 characters";
  }

  if (data.company && data.company.length > 255) {
    errors.company = "Company must be less than 255 characters";
  }

  if (!data.addressLine1?.trim()) {
    errors.addressLine1 = "Address is required";
  } else if (data.addressLine1.length > 255) {
    errors.addressLine1 = "Address must be less than 255 characters";
  }

  if (data.addressLine2 && data.addressLine2.length > 255) {
    errors.addressLine2 = "Address line 2 must be less than 255 characters";
  }

  if (!data.city?.trim()) {
    errors.city = "City is required";
  } else if (data.city.length > 100) {
    errors.city = "City must be less than 100 characters";
  }

  if (data.state && data.state.length > 100) {
    errors.state = "State must be less than 100 characters";
  }

  if (data.postalCode && data.postalCode.length > 20) {
    errors.postalCode = "Postal code must be less than 20 characters";
  }

  if (!data.country?.trim()) {
    errors.country = "Country is required";
  } else if (data.country.length > 100) {
    errors.country = "Country must be less than 100 characters";
  }

  if (data.phone && data.phone.length > 50) {
    errors.phone = "Phone must be less than 50 characters";
  } else if (data.phone && !/^[+]?[\d\s\-().]+$/.test(data.phone)) {
    errors.phone = "Please enter a valid phone number";
  }

  return errors;
}

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: customer, isLoading: customerLoading } = useCustomer(customerId);
  const { data: addresses, isLoading: addressesLoading } = useCustomerAddresses(customerId);
  const updateCustomer = useUpdateCustomer();
  const addAddress = useAddCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();

  const [tagInput, setTagInput] = useState("");
  const [addressForm, setAddressForm] = useState<AddressFormState | null>(null);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      isGuest: false,
      isActive: true,
      acceptsMarketing: false,
      notes: "",
      tags: [],
    },
  });

  // Load customer data into form
  useEffect(() => {
    if (customer) {
      reset({
        email: customer.email,
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        phone: customer.phone || "",
        isGuest: customer.isGuest || false,
        isActive: customer.isActive,
        acceptsMarketing: customer.acceptsMarketing || false,
        notes: customer.notes || "",
        tags: customer.tags || [],
      });
    }
  }, [customer, reset]);

  const tags = watch("tags") || [];
  const isActive = watch("isActive");
  const isGuest = watch("isGuest");
  const acceptsMarketing = watch("acceptsMarketing");

  const shippingAddresses = addresses?.filter((a) => a.type === "shipping") || [];
  const billingAddresses = addresses?.filter((a) => a.type === "billing") || [];

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setValue("tags", [...tags, trimmedTag], { shouldDirty: true });
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tagToRemove),
      { shouldDirty: true }
    );
  };

  const onSubmit = async (data: CustomerFormData) => {
    const submitData = {
      ...data,
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
      tags: data.tags.length > 0 ? data.tags : undefined,
    };

    await updateCustomer.mutateAsync({ id: customerId, data: submitData });
  };

  const handleOpenAddressForm = (type: "shipping" | "billing", address?: CustomerAddress) => {
    setAddressErrors({});
    if (address) {
      setAddressForm({
        isOpen: true,
        mode: "edit",
        addressId: address.id,
        type,
        data: {
          type,
          firstName: address.firstName,
          lastName: address.lastName,
          company: address.company || "",
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || "",
          city: address.city,
          state: address.state || "",
          postalCode: address.postalCode || "",
          country: address.country,
          phone: address.phone || "",
          isDefault: address.isDefault,
        },
      });
    } else {
      setAddressForm({
        isOpen: true,
        mode: "add",
        type,
        data: { ...emptyAddress, type },
      });
    }
  };

  const handleAddressFieldChange = (field: keyof AddressInput, value: string | boolean) => {
    if (addressForm) {
      setAddressForm({
        ...addressForm,
        data: { ...addressForm.data, [field]: value },
      });
      // Clear error for this field when user starts typing
      if (addressErrors[field]) {
        setAddressErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  const handleSaveAddress = async () => {
    if (!addressForm) return;

    // Validate address
    const errors = validateAddress(addressForm.data);
    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    const data: AddressInput = {
      ...addressForm.data,
      firstName: addressForm.data.firstName.trim(),
      lastName: addressForm.data.lastName.trim(),
      company: addressForm.data.company?.trim() || undefined,
      addressLine1: addressForm.data.addressLine1.trim(),
      addressLine2: addressForm.data.addressLine2?.trim() || undefined,
      city: addressForm.data.city.trim(),
      state: addressForm.data.state?.trim() || undefined,
      postalCode: addressForm.data.postalCode?.trim() || undefined,
      country: addressForm.data.country.trim(),
      phone: addressForm.data.phone?.trim() || undefined,
    };

    if (addressForm.mode === "add") {
      await addAddress.mutateAsync({ customerId, data });
    } else if (addressForm.addressId) {
      await updateAddress.mutateAsync({
        customerId,
        addressId: addressForm.addressId,
        data,
      });
    }
    setAddressForm(null);
    setAddressErrors({});
  };

  const handleDeleteAddress = async () => {
    if (deleteAddressId) {
      await deleteAddress.mutateAsync({ customerId, addressId: deleteAddressId });
      setDeleteAddressId(null);
    }
  };

  const handleSetDefault = async (address: CustomerAddress) => {
    await updateAddress.mutateAsync({
      customerId,
      addressId: address.id,
      data: { isDefault: true },
    });
  };

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Edit Customer: {customer.firstName} {customer.lastName}
        </h1>
        <p className="text-muted-foreground">
          Update customer information and manage addresses
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <FormSection
              title="Basic Information"
              description="Customer contact details"
              icon={User}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="customer@example.com"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    placeholder="John"
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    placeholder="Doe"
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="+1 555 123 4567"
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Addresses Section */}
            <FormSection
              title="Addresses"
              description="Manage shipping and billing addresses"
              icon={MapPin}
            >
              <div className="space-y-6">
                {/* Shipping Addresses */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Shipping Addresses</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAddressForm("shipping")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {addressesLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading addresses...
                    </div>
                  ) : shippingAddresses.length > 0 ? (
                    <div className="space-y-2">
                      {shippingAddresses.map((addr) => (
                        <AddressCard
                          key={addr.id}
                          address={addr}
                          onEdit={() => handleOpenAddressForm("shipping", addr)}
                          onDelete={() => setDeleteAddressId(addr.id)}
                          onSetDefault={() => handleSetDefault(addr)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No shipping addresses
                    </p>
                  )}
                </div>

                {/* Billing Addresses */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Billing Addresses</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAddressForm("billing")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {addressesLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading addresses...
                    </div>
                  ) : billingAddresses.length > 0 ? (
                    <div className="space-y-2">
                      {billingAddresses.map((addr) => (
                        <AddressCard
                          key={addr.id}
                          address={addr}
                          onEdit={() => handleOpenAddressForm("billing", addr)}
                          onDelete={() => setDeleteAddressId(addr.id)}
                          onSetDefault={() => handleSetDefault(addr)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No billing addresses
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Tags */}
            <FormSection
              title="Tags"
              description="Organize customers with tags"
              icon={Tag}
              defaultOpen={false}
            >
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag(tagInput)}
                  >
                    Add
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tagSuggestions
                      .filter((s) => !tags.includes(s))
                      .map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => addTag(suggestion)}
                        >
                          + {suggestion}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Admin Notes */}
            <FormSection
              title="Admin Notes"
              description="Internal notes (not visible to customer)"
              icon={FileText}
              defaultOpen={false}
            >
              <div>
                <Textarea
                  {...register("notes")}
                  placeholder="Add notes about this customer..."
                  rows={4}
                  className={errors.notes ? "border-destructive" : ""}
                />
                {errors.notes && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.notes.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum 5000 characters
                </p>
              </div>
            </FormSection>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Customer can log in
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      setValue("isActive", checked, { shouldDirty: true })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isGuest">Guest</Label>
                    <p className="text-sm text-muted-foreground">
                      Guest checkout customer
                    </p>
                  </div>
                  <Switch
                    id="isGuest"
                    checked={isGuest}
                    onCheckedChange={(checked) =>
                      setValue("isGuest", checked, { shouldDirty: true })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="acceptsMarketing">Marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Accepts marketing emails
                    </p>
                  </div>
                  <Switch
                    id="acceptsMarketing"
                    checked={acceptsMarketing}
                    onCheckedChange={(checked) =>
                      setValue("acceptsMarketing", checked, { shouldDirty: true })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(customer.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDate(customer.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-medium">{customer.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Orders</span>
                  <span className="font-medium text-green-600">{customer.paidOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unpaid Orders</span>
                  <span className={`font-medium ${customer.unpaidOrders > 0 ? "text-destructive" : ""}`}>
                    {customer.unpaidOrders}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Spent</span>
                  <span className="font-medium">
                    {formatCurrency(customer.totalSpent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Debt</span>
                  <span className={`font-medium ${customer.debt > 0 ? "text-destructive" : ""}`}>
                    {formatCurrency(customer.debt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background border-t mt-6 -mx-6 px-6 py-4 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/customers/${customerId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>

      {/* Address Form Dialog */}
      <AlertDialog
        open={addressForm?.isOpen}
        onOpenChange={(open) => !open && setAddressForm(null)}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {addressForm?.mode === "add" ? "Add" : "Edit"}{" "}
              {addressForm?.type === "shipping" ? "Shipping" : "Billing"} Address
            </AlertDialogTitle>
          </AlertDialogHeader>
          {addressForm && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={addressForm.data.firstName}
                    onChange={(e) =>
                      handleAddressFieldChange("firstName", e.target.value)
                    }
                    className={addressErrors.firstName ? "border-destructive" : ""}
                  />
                  {addressErrors.firstName && (
                    <p className="text-sm text-destructive mt-1">
                      {addressErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={addressForm.data.lastName}
                    onChange={(e) =>
                      handleAddressFieldChange("lastName", e.target.value)
                    }
                    className={addressErrors.lastName ? "border-destructive" : ""}
                  />
                  {addressErrors.lastName && (
                    <p className="text-sm text-destructive mt-1">
                      {addressErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={addressForm.data.company || ""}
                  onChange={(e) =>
                    handleAddressFieldChange("company", e.target.value)
                  }
                  className={addressErrors.company ? "border-destructive" : ""}
                />
                {addressErrors.company && (
                  <p className="text-sm text-destructive mt-1">
                    {addressErrors.company}
                  </p>
                )}
              </div>
              <div>
                <Label>Address Line 1 *</Label>
                <Input
                  value={addressForm.data.addressLine1}
                  onChange={(e) =>
                    handleAddressFieldChange("addressLine1", e.target.value)
                  }
                  className={addressErrors.addressLine1 ? "border-destructive" : ""}
                />
                {addressErrors.addressLine1 && (
                  <p className="text-sm text-destructive mt-1">
                    {addressErrors.addressLine1}
                  </p>
                )}
              </div>
              <div>
                <Label>Address Line 2</Label>
                <Input
                  value={addressForm.data.addressLine2 || ""}
                  onChange={(e) =>
                    handleAddressFieldChange("addressLine2", e.target.value)
                  }
                  className={addressErrors.addressLine2 ? "border-destructive" : ""}
                />
                {addressErrors.addressLine2 && (
                  <p className="text-sm text-destructive mt-1">
                    {addressErrors.addressLine2}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>City *</Label>
                  <Input
                    value={addressForm.data.city}
                    onChange={(e) =>
                      handleAddressFieldChange("city", e.target.value)
                    }
                    className={addressErrors.city ? "border-destructive" : ""}
                  />
                  {addressErrors.city && (
                    <p className="text-sm text-destructive mt-1">
                      {addressErrors.city}
                    </p>
                  )}
                </div>
                <div>
                  <Label>State/Region</Label>
                  <Input
                    value={addressForm.data.state || ""}
                    onChange={(e) =>
                      handleAddressFieldChange("state", e.target.value)
                    }
                    className={addressErrors.state ? "border-destructive" : ""}
                  />
                  {addressErrors.state && (
                    <p className="text-sm text-destructive mt-1">
                      {addressErrors.state}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={addressForm.data.postalCode || ""}
                    onChange={(e) =>
                      handleAddressFieldChange("postalCode", e.target.value)
                    }
                    className={addressErrors.postalCode ? "border-destructive" : ""}
                  />
                  {addressErrors.postalCode && (
                    <p className="text-sm text-destructive mt-1">
                      {addressErrors.postalCode}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Country *</Label>
                  <Select
                    value={addressForm.data.country}
                    onValueChange={(value) =>
                      handleAddressFieldChange("country", value)
                    }
                  >
                    <SelectTrigger className={addressErrors.country ? "border-destructive" : ""}>
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
                  {addressErrors.country && (
                    <p className="text-sm text-destructive mt-1">
                      {addressErrors.country}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={addressForm.data.phone || ""}
                  onChange={(e) =>
                    handleAddressFieldChange("phone", e.target.value)
                  }
                  className={addressErrors.phone ? "border-destructive" : ""}
                />
                {addressErrors.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {addressErrors.phone}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isDefault"
                  checked={addressForm.data.isDefault || false}
                  onCheckedChange={(checked) =>
                    handleAddressFieldChange("isDefault", checked)
                  }
                />
                <Label htmlFor="isDefault">
                  Set as default {addressForm.type} address
                </Label>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAddressErrors({})}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveAddress}
              disabled={addAddress.isPending || updateAddress.isPending}
            >
              {(addAddress.isPending || updateAddress.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Address Confirmation */}
      <AlertDialog
        open={!!deleteAddressId}
        onOpenChange={() => setDeleteAddressId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAddress}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteAddress.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Address Card Component
function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: CustomerAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div className="p-3 border rounded-lg flex items-start justify-between gap-4">
      <div className="text-sm space-y-1 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {address.firstName} {address.lastName}
          </span>
          {address.isDefault && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Default
            </Badge>
          )}
        </div>
        {address.company && (
          <p className="text-muted-foreground">{address.company}</p>
        )}
        <p>{address.addressLine1}</p>
        {address.addressLine2 && <p>{address.addressLine2}</p>}
        <p>
          {address.city}
          {address.state && `, ${address.state}`}
          {address.postalCode && ` ${address.postalCode}`}
        </p>
        <p>{address.country}</p>
        {address.phone && (
          <p className="text-muted-foreground">{address.phone}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {!address.isDefault && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSetDefault}
            title="Set as default"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
