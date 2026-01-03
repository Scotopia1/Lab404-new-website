"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Plus, Pencil, Save, X, Loader2, Trash2 } from "lucide-react";
import {
  useCustomerAddresses,
  useAddCustomerAddress,
  useUpdateCustomerAddress,
  CustomerAddress,
  AddressInput,
} from "@/hooks/use-customers";
import { OrderAddress } from "@/hooks/use-orders";

export interface AddressSelectorProps {
  customerId: string | null;
  label: "Shipping" | "Billing";
  addressData: OrderAddress;
  onAddressChange: (address: OrderAddress) => void;
  isGuest?: boolean;
  errors?: Record<string, { message?: string }>;
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

const emptyAddress: OrderAddress = {
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
};

export function AddressSelector({
  customerId,
  label,
  addressData,
  onAddressChange,
  isGuest = false,
  errors = {},
}: AddressSelectorProps) {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editedAddress, setEditedAddress] = useState<OrderAddress>(addressData);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: addresses, isLoading: addressesLoading } = useCustomerAddresses(customerId);
  const addAddress = useAddCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();

  // Filter addresses by type (shipping or billing)
  const filteredAddresses = addresses?.filter(
    (addr) => addr.type === label.toLowerCase()
  ) || [];

  // Reset state when customer changes
  useEffect(() => {
    if (!customerId) {
      setSelectedAddressId(null);
      setIsEditing(false);
      setIsAddingNew(false);
    }
  }, [customerId]);

  // Auto-select default address when addresses load
  useEffect(() => {
    if (filteredAddresses.length > 0 && !selectedAddressId && customerId) {
      const defaultAddr = filteredAddresses.find((a) => a.isDefault);
      if (defaultAddr) {
        handleSelectAddress(defaultAddr.id);
      }
    }
  }, [filteredAddresses, customerId]);

  // Sync edited address with parent
  useEffect(() => {
    if (isEditing || isAddingNew) {
      setEditedAddress(addressData);
    }
  }, [addressData, isEditing, isAddingNew]);

  const handleSelectAddress = useCallback((addressId: string) => {
    const address = filteredAddresses.find((a) => a.id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setIsEditing(false);
      setIsAddingNew(false);
      onAddressChange({
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
      });
    }
  }, [filteredAddresses, onAddressChange]);

  const handleFieldChange = (field: keyof OrderAddress, value: string) => {
    const updated = { ...editedAddress, [field]: value };
    setEditedAddress(updated);
    onAddressChange(updated);
  };

  const handleStartEdit = () => {
    setEditedAddress(addressData);
    setIsEditing(true);
    setIsAddingNew(false);
  };

  const handleStartAddNew = () => {
    setEditedAddress({ ...emptyAddress });
    onAddressChange({ ...emptyAddress });
    setIsAddingNew(true);
    setIsEditing(false);
    setSelectedAddressId(null);
  };

  const handleCancelEdit = () => {
    if (selectedAddressId) {
      handleSelectAddress(selectedAddressId);
    } else {
      onAddressChange({ ...emptyAddress });
    }
    setIsEditing(false);
    setIsAddingNew(false);
  };

  const handleSaveToCustomer = async () => {
    if (!customerId) return;

    setIsSyncing(true);
    try {
      const addressInput: AddressInput = {
        type: label.toLowerCase() as "shipping" | "billing",
        firstName: editedAddress.firstName,
        lastName: editedAddress.lastName,
        company: editedAddress.company || undefined,
        addressLine1: editedAddress.addressLine1,
        addressLine2: editedAddress.addressLine2 || undefined,
        city: editedAddress.city,
        state: editedAddress.state || undefined,
        postalCode: editedAddress.postalCode || undefined,
        country: editedAddress.country,
        phone: editedAddress.phone || undefined,
        isDefault: filteredAddresses.length === 0,
      };

      if (isAddingNew) {
        const newAddress = await addAddress.mutateAsync({
          customerId,
          data: addressInput,
        });
        setSelectedAddressId(newAddress.id);
        setIsAddingNew(false);
      } else if (isEditing && selectedAddressId) {
        await updateAddress.mutateAsync({
          customerId,
          addressId: selectedAddressId,
          data: addressInput,
        });
        setIsEditing(false);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Show manual entry for guests or when no customer selected
  if (isGuest || !customerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {label} Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm
            address={addressData}
            onChange={onAddressChange}
            errors={errors}
          />
        </CardContent>
      </Card>
    );
  }

  // Customer is selected - show address selector
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {label} Address
          </CardTitle>
          {!isEditing && !isAddingNew && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStartAddNew}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add New
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Dropdown */}
        {!isAddingNew && (
          <div className="space-y-2">
            <Label>Select from saved addresses</Label>
            {addressesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading addresses...
              </div>
            ) : filteredAddresses.length > 0 ? (
              <Select
                value={selectedAddressId || ""}
                onValueChange={handleSelectAddress}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an address" />
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
                No saved {label.toLowerCase()} addresses. Add a new address below.
              </p>
            )}
          </div>
        )}

        {/* Selected Address Display / Edit Form */}
        {(selectedAddressId || isAddingNew) && (
          <>
            {isEditing || isAddingNew ? (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {isAddingNew ? "New Address" : "Edit Address"}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveToCustomer}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save to Customer
                    </Button>
                  </div>
                </div>
                <AddressForm
                  address={editedAddress}
                  onChange={(addr) => {
                    setEditedAddress(addr);
                    onAddressChange(addr);
                  }}
                  errors={errors}
                />
              </div>
            ) : (
              <div className="pt-4 border-t">
                <div className="flex items-start justify-between">
                  <AddressDisplay address={addressData} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEdit}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Show form immediately if no addresses */}
        {!selectedAddressId && !isAddingNew && filteredAddresses.length === 0 && (
          <div className="pt-4 border-t">
            <AddressForm
              address={addressData}
              onChange={onAddressChange}
              errors={errors}
            />
            {customerId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleSaveToCustomer}
                disabled={isSyncing || !addressData.firstName || !addressData.addressLine1}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save to Customer Account
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Address Form Component
interface AddressFormProps {
  address: OrderAddress;
  onChange: (address: OrderAddress) => void;
  errors?: Record<string, { message?: string }>;
}

function AddressForm({ address, onChange, errors = {} }: AddressFormProps) {
  const handleChange = (field: keyof OrderAddress, value: string) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>First Name *</Label>
          <Input
            value={address.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Last Name *</Label>
          <Input
            value={address.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Company (Optional)</Label>
        <Input
          value={address.company || ""}
          onChange={(e) => handleChange("company", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Address Line 1 *</Label>
        <Input
          value={address.addressLine1}
          onChange={(e) => handleChange("addressLine1", e.target.value)}
        />
        {errors.addressLine1 && (
          <p className="text-sm text-destructive">{errors.addressLine1.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Address Line 2 (Optional)</Label>
        <Input
          value={address.addressLine2 || ""}
          onChange={(e) => handleChange("addressLine2", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>City *</Label>
          <Input
            value={address.city}
            onChange={(e) => handleChange("city", e.target.value)}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>State/Region</Label>
          <Input
            value={address.state || ""}
            onChange={(e) => handleChange("state", e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Postal Code</Label>
          <Input
            value={address.postalCode || ""}
            onChange={(e) => handleChange("postalCode", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Country *</Label>
          <Select
            value={address.country}
            onValueChange={(value) => handleChange("country", value)}
          >
            <SelectTrigger>
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
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          value={address.phone || ""}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
      </div>
    </div>
  );
}

// Address Display Component
interface AddressDisplayProps {
  address: OrderAddress;
}

function AddressDisplay({ address }: AddressDisplayProps) {
  return (
    <div className="text-sm space-y-1">
      <p className="font-medium">
        {address.firstName} {address.lastName}
      </p>
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
  );
}

export { AddressForm, AddressDisplay };
