/**
 * Address Types
 *
 * TypeScript type definitions for address-related entities.
 * These types match the API schema exactly from customers.routes.ts.
 */

/**
 * Address entity from API
 * Complete address record with all database fields
 */
export interface Address {
  id: string;
  customerId: string;
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  phone?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Address input for create/update operations
 * Excludes auto-generated fields (id, customerId, timestamps)
 */
export interface AddressInput {
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

/**
 * Address form props for AddressForm component
 */
export interface AddressFormProps {
  address?: Address;
  onSubmit: (data: AddressInput) => void;
  isSubmitting: boolean;
}

/**
 * Address display format for UI rendering
 * Formatted and simplified for display purposes
 */
export interface AddressDisplay {
  id: string;
  type: 'shipping' | 'billing';
  fullName: string;
  fullAddress: string;
  isDefault: boolean;
}

/**
 * Helper type for address type filter
 */
export type AddressType = 'shipping' | 'billing';

/**
 * Helper function to format address for display
 */
export function formatAddress(address: Address): AddressDisplay {
  const addressParts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return {
    id: address.id,
    type: address.type,
    fullName: `${address.firstName} ${address.lastName}`,
    fullAddress: addressParts.join(', '),
    isDefault: address.isDefault,
  };
}

/**
 * Helper function to get full name from address
 */
export function getFullName(address: Address): string {
  return `${address.firstName} ${address.lastName}`;
}

/**
 * Helper function to format address as multi-line string
 */
export function formatAddressMultiLine(address: Address): string {
  const lines = [
    getFullName(address),
    address.company,
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
    address.country,
    address.phone,
  ].filter(Boolean);

  return lines.join('\n');
}
