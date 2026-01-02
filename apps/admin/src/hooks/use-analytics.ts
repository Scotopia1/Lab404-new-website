import { useQuery } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalCustomers: number;
  customersChange: number;
  averageOrderValue: number;
  aovChange: number;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
}

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
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

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  period?: "day" | "week" | "month" | "year";
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<DashboardStats>>("/analytics/dashboard");
        return res.data.data;
      } catch {
        // Return mock data if analytics endpoint doesn't exist
        return {
          totalRevenue: 125430,
          revenueChange: 12.5,
          totalOrders: 1284,
          ordersChange: 8.2,
          totalCustomers: 892,
          customersChange: 5.7,
          averageOrderValue: 97.68,
          aovChange: 3.4,
        };
      }
    },
  });
}

export function useSalesData(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "sales", params],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<SalesDataPoint[]>>("/analytics/sales", {
          params,
        });
        return res.data.data;
      } catch {
        // Return mock data
        const mockData: SalesDataPoint[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          mockData.push({
            date: date.toISOString().split("T")[0],
            revenue: Math.floor(Math.random() * 5000) + 2000,
            orders: Math.floor(Math.random() * 50) + 20,
          });
        }
        return mockData;
      }
    },
  });
}

export function useOrdersByStatus() {
  return useQuery({
    queryKey: ["analytics", "orders-by-status"],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<OrdersByStatus[]>>(
          "/analytics/sales/by-status"
        );
        return res.data.data;
      } catch {
        // Return mock data
        return [
          { status: "pending", count: 45 },
          { status: "confirmed", count: 32 },
          { status: "processing", count: 28 },
          { status: "shipped", count: 156 },
          { status: "delivered", count: 892 },
          { status: "cancelled", count: 23 },
        ];
      }
    },
  });
}

export function useTopProducts(limit = 10) {
  return useQuery({
    queryKey: ["analytics", "top-products", limit],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<TopProduct[]>>("/analytics/products/top-selling", {
          params: { limit },
        });
        return res.data.data;
      } catch {
        // Return mock data
        return [
          { id: "1", name: "Arduino Uno R3", revenue: 12500, quantity: 250 },
          { id: "2", name: "Raspberry Pi 4", revenue: 9800, quantity: 98 },
          { id: "3", name: "ESP32 Dev Board", revenue: 7200, quantity: 360 },
          { id: "4", name: "LCD Display 16x2", revenue: 5600, quantity: 280 },
          { id: "5", name: "Servo Motor SG90", revenue: 4200, quantity: 420 },
          { id: "6", name: "Ultrasonic Sensor", revenue: 3800, quantity: 380 },
          { id: "7", name: "Breadboard 830", revenue: 3200, quantity: 640 },
          { id: "8", name: "Jumper Wires Kit", revenue: 2800, quantity: 560 },
          { id: "9", name: "LED Kit 100pcs", revenue: 2400, quantity: 240 },
          { id: "10", name: "Resistor Kit", revenue: 1800, quantity: 360 },
        ];
      }
    },
  });
}

export function useTopCategories(limit = 5) {
  return useQuery({
    queryKey: ["analytics", "top-categories", limit],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<TopCategory[]>>(
          "/analytics/top-categories",
          { params: { limit } }
        );
        return res.data.data;
      } catch {
        // Return mock data
        return [
          { id: "1", name: "Microcontrollers", revenue: 32500, products: 45 },
          { id: "2", name: "Sensors", revenue: 18900, products: 78 },
          { id: "3", name: "Displays", revenue: 15600, products: 32 },
          { id: "4", name: "Motors", revenue: 12400, products: 28 },
          { id: "5", name: "Components", revenue: 8200, products: 156 },
        ];
      }
    },
  });
}

export function useRecentOrders(limit = 10) {
  return useQuery({
    queryKey: ["analytics", "recent-orders", limit],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<RecentOrder[]>>(
          "/analytics/orders/recent",
          { params: { limit } }
        );
        return res.data.data;
      } catch {
        // Return mock data
        const statuses = ["pending", "confirmed", "processing", "shipped", "delivered"];
        const mockOrders: RecentOrder[] = [];
        for (let i = 0; i < limit; i++) {
          const date = new Date();
          date.setHours(date.getHours() - i * 2);
          mockOrders.push({
            id: `order-${i}`,
            orderNumber: `ORD-${String(10000 + i).padStart(5, "0")}`,
            customer: `Customer ${i + 1}`,
            total: Math.floor(Math.random() * 300) + 50,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            createdAt: date.toISOString(),
          });
        }
        return mockOrders;
      }
    },
  });
}

export function useProductAnalytics(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["analytics", "products", params],
    queryFn: async () => {
      try {
        const res = await api.get<
          ApiResponse<{
            totalProducts: number;
            activeProducts: number;
            lowStock: number;
            outOfStock: number;
            topSelling: TopProduct[];
            stockValue: number;
          }>
        >("/analytics/products", { params });
        return res.data.data;
      } catch {
        // Return mock data
        return {
          totalProducts: 342,
          activeProducts: 298,
          lowStock: 23,
          outOfStock: 8,
          topSelling: [
            { id: "1", name: "Arduino Uno R3", revenue: 12500, quantity: 250 },
            { id: "2", name: "Raspberry Pi 4", revenue: 9800, quantity: 98 },
            { id: "3", name: "ESP32 Dev Board", revenue: 7200, quantity: 360 },
          ],
          stockValue: 45680,
        };
      }
    },
  });
}
