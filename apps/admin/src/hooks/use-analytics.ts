import { useQuery } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";

// ===========================================
// Type Definitions
// ===========================================

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  period?: "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "all";
  groupBy?: "hour" | "day" | "week" | "month";
}

export interface DashboardStats {
  totalRevenue: number;
  orderCount: number;
  pendingOrders: number;
  customerCount: number;
  averageOrderValue: number;
  previousPeriodComparison?: {
    revenueChange: number;
    orderCountChange: number;
    customerCountChange: number;
  };
}

export interface SalesDataPoint {
  period: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
  totalValue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface TopCategory {
  id: string;
  name: string;
  revenue: number;
  products: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface RevenueBreakdown {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  orderCount: number;
}

export interface PaymentMethod {
  paymentMethod: string;
  revenue: number;
  orderCount: number;
}

export interface CustomerOverview {
  totalCustomers: number;
  guestCustomers: number;
  registeredCustomers: number;
  customersWithOrders: number;
  topCustomers: TopCustomer[];
}

export interface TopCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  orderCount: number;
}

export interface NewCustomerData {
  period: string;
  total: number;
  guests: number;
  registered: number;
}

export interface LowStockData {
  products: Array<{
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    status: string;
  }>;
  variants: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    options: Record<string, string>;
    stockQuantity: number;
  }>;
  threshold: number;
}

export interface ProductAnalytics {
  totalProducts: number;
  activeProducts: number;
  lowStock: number;
  outOfStock: number;
  stockValue: number;
}

// ===========================================
// Dashboard Hooks
// ===========================================

/**
 * Get dashboard overview statistics
 */
export function useDashboardStats(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "dashboard", params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardStats>>("/analytics/dashboard", {
        params,
      });
      return res.data.data;
    },
  });
}

// ===========================================
// Sales Hooks
// ===========================================

/**
 * Get sales data over time
 */
export function useSalesData(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "sales", params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SalesDataPoint[]>>("/analytics/sales", {
        params,
      });
      return res.data.data;
    },
  });
}

/**
 * Get orders grouped by status
 */
export function useOrdersByStatus(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "orders-by-status", params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<OrdersByStatus[]>>(
        "/analytics/sales/by-status",
        { params }
      );
      return res.data.data;
    },
  });
}

/**
 * Get revenue breakdown by components
 */
export function useRevenueBreakdown(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "revenue-breakdown", params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<RevenueBreakdown>>(
        "/analytics/revenue/breakdown",
        { params }
      );
      return res.data.data;
    },
  });
}

/**
 * Get revenue by payment method
 */
export function usePaymentMethods(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "payment-methods", params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaymentMethod[]>>(
        "/analytics/revenue/by-payment-method",
        { params }
      );
      return res.data.data;
    },
  });
}

/**
 * Get recent orders
 */
export function useRecentOrders(limit = 10, params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "recent-orders", limit, params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<RecentOrder[]>>(
        "/analytics/orders/recent",
        { params: { ...params, limit } }
      );
      return res.data.data;
    },
  });
}

// ===========================================
// Product Hooks
// ===========================================

/**
 * Get top selling products
 */
export function useTopProducts(limit = 10, params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "top-products", limit, params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TopProduct[]>>(
        "/analytics/products/top-selling",
        { params: { ...params, limit } }
      );
      return res.data.data;
    },
  });
}

/**
 * Get low stock products and variants
 */
export function useLowStock(threshold = 10) {
  return useQuery({
    queryKey: ["analytics", "low-stock", threshold],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LowStockData>>(
        "/analytics/products/low-stock",
        { params: { threshold } }
      );
      return res.data.data;
    },
  });
}

/**
 * Get product analytics overview
 */
export function useProductAnalytics(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "products-overview", params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProductAnalytics>>(
        "/analytics/products/overview",
        { params }
      );
      return res.data.data;
    },
  });
}

/**
 * Get top categories by revenue
 * Note: This endpoint may not exist yet in the backend
 */
export function useTopCategories(limit = 5, params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "top-categories", limit, params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TopCategory[]>>(
        "/analytics/categories/top",
        { params: { ...params, limit } }
      );
      return res.data.data;
    },
    // Don't retry if endpoint doesn't exist
    retry: false,
  });
}

// ===========================================
// Customer Hooks
// ===========================================

/**
 * Get customer analytics overview
 */
export function useCustomerAnalytics(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "customers-overview", params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CustomerOverview>>(
        "/analytics/customers/overview",
        { params }
      );
      return res.data.data;
    },
  });
}

/**
 * Get new customers over time
 */
export function useNewCustomers(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "new-customers", params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<NewCustomerData[]>>(
        "/analytics/customers/new",
        { params }
      );
      return res.data.data;
    },
  });
}

// ===========================================
// Utility Hooks
// ===========================================

/**
 * Export analytics data
 */
export function useExportAnalytics(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "export", params],
    queryFn: async () => {
      const res = await api.get("/analytics/export", {
        params,
        responseType: "blob",
      });
      return res.data;
    },
    enabled: false, // Only run when explicitly called
  });
}
