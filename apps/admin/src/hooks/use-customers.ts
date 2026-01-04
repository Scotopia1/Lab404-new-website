import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";
import { toast } from "sonner";

export interface CustomerAddress {
  id: string;
  customerId: string;
  type: "shipping" | "billing";
  isDefault: boolean;
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
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  type: "shipping" | "billing";
  isDefault?: boolean;
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
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
}

export interface CreateCustomerInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isGuest?: boolean;
  isActive?: boolean;
  acceptsMarketing?: boolean;
  notes?: string;
  tags?: string[];
}

export interface UpdateCustomerInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isGuest?: boolean;
  isActive?: boolean;
  acceptsMarketing?: boolean;
  notes?: string;
  tags?: string[];
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isGuest?: boolean;
  isActive: boolean;
  acceptsMarketing?: boolean;
  notes?: string | null;
  tags?: string[] | null;
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  totalSpent: number;
  debt: number;
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
      const res = await api.get<ApiResponse<CustomerOrder[]>>(`/customers/${id}/orders`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerInput) => {
      const res = await api.post<ApiResponse<Customer>>("/customers", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create customer");
    },
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
      data: UpdateCustomerInput;
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

// ===========================================
// Customer Address Hooks
// ===========================================

export function useCustomerAddresses(customerId: string | null) {
  return useQuery({
    queryKey: ["customers", customerId, "addresses"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CustomerAddress[]>>(
        `/customers/${customerId}/addresses`
      );
      return res.data.data;
    },
    enabled: !!customerId,
  });
}

export function useAddCustomerAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      data,
    }: {
      customerId: string;
      data: AddressInput;
    }) => {
      const res = await api.post<ApiResponse<CustomerAddress>>(
        `/customers/${customerId}/addresses`,
        data
      );
      return res.data.data;
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ["customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers", customerId, "addresses"] });
      toast.success("Address added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add address");
    },
  });
}

export function useUpdateCustomerAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      addressId,
      data,
    }: {
      customerId: string;
      addressId: string;
      data: Partial<AddressInput>;
    }) => {
      const res = await api.put<ApiResponse<CustomerAddress>>(
        `/customers/${customerId}/addresses/${addressId}`,
        data
      );
      return res.data.data;
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ["customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers", customerId, "addresses"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update address");
    },
  });
}

export function useDeleteCustomerAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      addressId,
    }: {
      customerId: string;
      addressId: string;
    }) => {
      await api.delete(`/customers/${customerId}/addresses/${addressId}`);
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ["customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers", customerId, "addresses"] });
      toast.success("Address deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete address");
    },
  });
}