import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";
import { toast } from "sonner";

export interface CustomerAddress {
  id: string;
  type: "shipping" | "billing";
  isDefault: boolean;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  addresses?: CustomerAddress[];
  createdAt: string;
  updatedAt: string;
}

interface CustomersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useCustomers(params: CustomersParams = {}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<Customer[]> & {
          meta: { page: number; limit: number; total: number; totalPages: number };
        }
      >("/customers", { params });
      return res.data;
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCustomerOrders(id: string) {
  return useQuery({
    queryKey: ["customers", id, "orders"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<unknown[]>>(`/customers/${id}/orders`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ firstName: string; lastName: string; phone: string; isActive: boolean }>;
    }) => {
      const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", id] });
      toast.success("Customer updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update customer");
    },
  });
}

export function useDeactivateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deactivated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to deactivate customer");
    },
  });
}
