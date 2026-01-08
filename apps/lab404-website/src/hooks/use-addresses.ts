import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types matching API schema
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

// Input type for create/update operations
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
 * Fetch all customer addresses
 */
export function useAddresses(): UseQueryResult<Address[]> {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Address[] }>('/customers/me/addresses');
      return response.data.data;
    },
  });
}

/**
 * Fetch single address by ID (for future use)
 */
export function useAddress(id: string | undefined): UseQueryResult<Address> {
  return useQuery({
    queryKey: ['address', id],
    queryFn: async () => {
      if (!id) throw new Error('Address ID required');
      const response = await api.get<{ success: boolean; data: Address }>(`/customers/me/addresses/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Create new address mutation
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddressInput) => {
      const response = await api.post<{ success: boolean; data: Address }>('/customers/me/addresses', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

/**
 * Update existing address mutation
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AddressInput> }) => {
      const response = await api.put<{ success: boolean; data: Address }>(`/customers/me/addresses/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

/**
 * Delete address mutation
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/me/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}
