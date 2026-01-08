import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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
      const response = await api.get<Customer>('/customers/me');
      return response.data;
    },
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const response = await api.put<Customer>('/customers/me', data);
      return response.data;
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
      const response = await api.put<{ message: string }>('/customers/me/password', data);
      return response.data;
    },
  });
}
