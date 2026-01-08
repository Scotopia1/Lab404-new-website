import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types
interface OrderListItem {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  totalSnapshot: number;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  shippingAddress: {
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
    email?: string;
  };
  billingAddress: any;
  currency: string;
  subtotal: number;
  taxRate: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  promoCodeSnapshot: string | null;
  paymentMethod: string;
  customerNotes: string | null;
  trackingNumber: string | null;
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
    variantOptions: Record<string, string> | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OrdersResponse {
  success: boolean;
  data: OrderListItem[];
  pagination: PaginationMeta;
}

interface OrderResponse {
  success: boolean;
  data: OrderDetail;
}

/**
 * Fetch paginated list of customer orders
 */
export function useOrders(page: number = 1, limit: number = 10): UseQueryResult<OrdersResponse> {
  return useQuery({
    queryKey: ['orders', page, limit],
    queryFn: async () => {
      const response = await api.get<OrdersResponse>(`/orders?page=${page}&limit=${limit}`);
      return response.data;
    },
  });
}

/**
 * Fetch single order by ID
 */
export function useOrder(orderId: string | undefined): UseQueryResult<OrderDetail> {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID required');
      const response = await api.get<OrderResponse>(`/orders/${orderId}`);
      return response.data.data;
    },
    enabled: !!orderId,
  });
}

/**
 * Fetch order by order number (for tracking)
 */
export function useOrderByNumber(orderNumber: string | undefined): UseQueryResult<OrderDetail> {
  return useQuery({
    queryKey: ['order', 'number', orderNumber],
    queryFn: async () => {
      if (!orderNumber) throw new Error('Order number required');
      const response = await api.get<OrderResponse>(`/orders/track/${orderNumber}`);
      return response.data.data;
    },
    enabled: !!orderNumber,
  });
}
