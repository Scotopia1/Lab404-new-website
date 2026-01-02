import type { UUID, ISODateString, Decimal } from './common';

// ===========================================
// Analytics Types
// ===========================================

export interface AnalyticsOverview {
  period: string;
  revenue: Decimal;
  revenueChange: Decimal;
  orders: number;
  ordersChange: Decimal;
  customers: number;
  customersChange: Decimal;
  averageOrderValue: Decimal;
  aovChange: Decimal;
}

export interface SalesDataPoint {
  date: string;
  revenue: Decimal;
  orders: number;
}

export interface SalesAnalytics {
  period: string;
  data: SalesDataPoint[];
  totalRevenue: Decimal;
  totalOrders: number;
}

export interface TopProduct {
  productId: UUID;
  productName: string;
  thumbnailUrl?: string;
  unitsSold: number;
  revenue: Decimal;
}

export interface LowStockProduct {
  productId: UUID;
  productName: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface ProductAnalytics {
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
}

export interface TopCustomer {
  customerId: UUID;
  customerName: string;
  customerEmail: string;
  orderCount: number;
  totalSpent: Decimal;
}

export interface CustomerAnalytics {
  newCustomers: number;
  returningCustomers: number;
  topCustomers: TopCustomer[];
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  ordersByStatus: OrderStatusCount[];
  averageProcessingTime?: number;
}

// ===========================================
// Analytics Query Types
// ===========================================

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface AnalyticsQuery {
  period?: AnalyticsPeriod;
  startDate?: ISODateString;
  endDate?: ISODateString;
}
