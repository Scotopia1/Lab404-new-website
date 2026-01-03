import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";
import { toast } from "sonner";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export type PaymentMethod = "cod" | "stripe" | "paypal";

export interface OrderAddress {
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

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  sku?: string;
  variantOptions?: Record<string, string>;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;

  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  // Notes
  adminNotes?: string | null;

  // Financial
  currency: string;
  subtotal: number;
  taxRate: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;

  // Promo
  promoCodeId?: string;
  promoCodeSnapshot?: string;

  // Payment
  paymentMethod: PaymentMethod;

  // Shipping & Tracking
  shippingMethod?: string;
  trackingNumber?: string;

  // Addresses
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;

  // Items
  items: OrderItem[];

  // Notes
  customerNotes?: string;

  // Timestamps
  confirmedAt?: string;
  processingAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderUpdateInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingMethod?: string;
  trackingNumber?: string;
  adminNotes?: string;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
}

interface OrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
}

// Custom hook for debouncing search input
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useOrders(params: OrdersParams = {}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<Order[]> & {
          meta: { page: number; limit: number; total: number; totalPages: number };
        }
      >("/orders/admin/all", { params });
      return res.data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const res = await api.put<ApiResponse<Order>>(`/orders/${id}`, { status });
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      toast.success("Order status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update order status");
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: OrderUpdateInput }) => {
      const res = await api.put<ApiResponse<Order>>(`/orders/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      toast.success("Order updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update order");
    },
  });
}

export interface CreateOrderInput {
  customerId?: string;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  items: { productId: string; variantId?: string; quantity: number }[];
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  sameAsShipping?: boolean;
  paymentMethod: "cod" | "bank_transfer" | "cash";
  paymentStatus?: "pending" | "paid";
  promoCode?: string;
  manualDiscount?: number;
  adminNotes?: string;
  customerNotes?: string;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const res = await api.post<ApiResponse<Order>>("/orders/admin", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create order");
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete order");
    },
  });
}
