import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  orderCount: number;
  createdAt: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Fetch customer profile
export function useProfile(): UseQueryResult<Customer> {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Customer }>('/customers/me');
      return response.data.data; // Extract customer from API response wrapper
    },
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const response = await api.put<{ success: boolean; data: Customer }>('/customers/me', data);
      return response.data.data; // Extract customer from API response wrapper
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      // Also update auth store if needed
    },
  });
}

// Change password mutation
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const response = await api.put<{ success: boolean; data: { message: string } }>('/customers/me/password', data);
      return response.data.data; // Extract message from API response wrapper
    },
  });
}
