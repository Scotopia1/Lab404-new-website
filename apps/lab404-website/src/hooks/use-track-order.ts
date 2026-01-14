import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types matching the API response from GET /api/orders/track/:orderNumber
export interface TrackingTimeline {
  status: string;
  timestamp: string;
  description: string;
}

export interface TrackingItem {
  productName: string;
  quantity: number;
  price: number;
}

export interface TrackingResult {
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  shippingMethod: string | null;
  trackingNumber: string | null;
  createdAt: string;
  total: number;
  itemCount: number;
  items: TrackingItem[];
  shippingLocation: {
    city?: string;
    country?: string;
  } | null;
  timeline: TrackingTimeline[];
}

interface TrackingResponse {
  success: boolean;
  data: TrackingResult;
}

/**
 * Hook for public order tracking
 * Fetches order tracking info by order number
 */
export function useTrackOrder(
  orderNumber: string | null
): UseQueryResult<TrackingResult, Error> {
  return useQuery({
    queryKey: ['track-order', orderNumber],
    queryFn: async () => {
      if (!orderNumber) throw new Error('Order number required');

      // URL-encode the order number to handle special characters like #
      const encodedOrderNumber = encodeURIComponent(orderNumber);
      const response = await api.get<TrackingResponse>(`/orders/track/${encodedOrderNumber}`);
      return response.data.data;
    },
    enabled: !!orderNumber && orderNumber.trim().length > 0,
    retry: false, // Don't retry on 404
    staleTime: 30000, // Cache for 30 seconds
  });
}
