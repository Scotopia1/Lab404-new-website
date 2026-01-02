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

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
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
  };
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
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
