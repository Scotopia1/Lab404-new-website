'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Address, AddressInput } from '@/hooks/use-addresses';

// Zod validation schema matching API addressSchema exactly
const addressFormSchema = z.object({
  type: z.enum(['shipping', 'billing'], {
    errorMap: () => ({ message: 'Address type must be shipping or billing' }),
  }),
  isDefault: z.boolean().optional().default(false),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  company: z.string()
    .max(255, 'Company must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  addressLine1: z.string()
    .min(1, 'Address is required')
    .max(255, 'Address must be less than 255 characters'),
  addressLine2: z.string()
    .max(255, 'Address line 2 must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  city: z.string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  state: z.string()
    .max(100, 'State must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  postalCode: z.string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .min(1, 'Country is required')
    .max(100, 'Country must be less than 100 characters'),
  phone: z.string()
    .max(50, 'Phone must be less than 50 characters')
    .regex(/^[+]?[\d\s\-().]*$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

export type AddressFormData = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  address?: Address;
  onSubmit: (data: AddressInput) => void;
  isSubmitting: boolean;
}

export function AddressForm({ address, onSubmit, isSubmitting }: AddressFormProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: address ? {
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country,
      phone: address.phone || '',
      isDefault: address.isDefault,
    } : {
      type: 'shipping',
      firstName: '',
      lastName: '',
      company: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
      isDefault: false,
    },
  });

  const handleFormSubmit = (data: AddressFormData) => {
    // Clean up empty optional fields
    const cleanedData: AddressInput = {
      type: data.type,
      firstName: data.firstName,
      lastName: data.lastName,
      addressLine1: data.addressLine1,
      city: data.city,
      country: data.country,
      isDefault: data.isDefault,
    };

    // Add optional fields only if they have values
    if (data.company) cleanedData.company = data.company;
    if (data.addressLine2) cleanedData.addressLine2 = data.addressLine2;
    if (data.state) cleanedData.state = data.state;
    if (data.postalCode) cleanedData.postalCode = data.postalCode;
    if (data.phone) cleanedData.phone = data.phone;

    onSubmit(cleanedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Type selector */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Type</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Company (optional) */}
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address fields */}
        <FormField
          control={form.control}
          name="addressLine1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="addressLine2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 2 (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* City, State, Postal Code */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Country */}
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone (optional) */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl>
                <Input {...field} type="tel" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Default checkbox */}
        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                </FormControl>
                <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                  Set as default {form.watch('type')} address
                </Label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit button */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
        </Button>
      </form>
    </Form>
  );
}
