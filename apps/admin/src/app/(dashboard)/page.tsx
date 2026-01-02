"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Title,
  Text,
  Metric,
  Flex,
  ProgressBar,
  Grid,
  AreaChart,
  DonutChart,
  BarList,
} from "@tremor/react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { api, ApiResponse } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// API Response interfaces (matching actual API)
interface DashboardApiResponse {
  totalRevenue: number;
  orderCount: number;
  pendingOrders: number;
  customerCount: number;
  averageOrderValue: number;
  previousPeriodComparison: {
    revenueChange: number;
    orderCountChange: number;
    customerCountChange: number;
  } | null;
}

interface SalesApiResponse {
  period: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
}

interface TopProductApiResponse {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

interface OrderStatusApiResponse {
  status: string;
  count: number;
  totalValue: number;
}

interface LowStockApiResponse {
  products: Array<{
    id: string;
    name: string;
    sku: string | null;
    stockQuantity: number;
    status: string;
  }>;
  variants: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string | null;
    stockQuantity: number;
  }>;
  threshold: number;
}

interface ProductCountApiResponse {
  id: string;
  name: string;
}

export default function DashboardPage() {
  // Dashboard stats
  const { data: dashboardData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardApiResponse>>(
        "/analytics/dashboard",
        { params: { period: "month" } }
      );
      return res.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Sales chart data
  const { data: salesData, refetch: refetchSales } = useQuery({
    queryKey: ["sales-chart"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SalesApiResponse[]>>("/analytics/sales", {
        params: { period: "month", groupBy: "day" },
      });
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // Top selling products
  const { data: topProducts, refetch: refetchTopProducts } = useQuery({
    queryKey: ["top-products"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TopProductApiResponse[]>>(
        "/analytics/products/top-selling",
        { params: { limit: 5, period: "month" } }
      );
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // Orders by status
  const { data: ordersByStatus, refetch: refetchOrderStatus } = useQuery({
    queryKey: ["orders-by-status"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<OrderStatusApiResponse[]>>(
        "/analytics/sales/by-status",
        { params: { period: "all" } }
      );
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // Low stock products
  const { data: lowStockData, refetch: refetchLowStock } = useQuery({
    queryKey: ["low-stock"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LowStockApiResponse>>(
        "/analytics/products/low-stock",
        { params: { threshold: 10 } }
      );
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // Total products count
  const { data: productsData } = useQuery({
    queryKey: ["products-count"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ data: ProductCountApiResponse[]; total: number }>>(
        "/products",
        { params: { limit: 1 } }
      );
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  // Refresh all data
  const handleRefresh = () => {
    refetchStats();
    refetchSales();
    refetchTopProducts();
    refetchOrderStatus();
    refetchLowStock();
  };

  // Transform data for display
  const stats = {
    revenue: {
      total: dashboardData?.totalRevenue ?? 0,
      change: dashboardData?.previousPeriodComparison?.revenueChange ?? 0,
    },
    orders: {
      total: dashboardData?.orderCount ?? 0,
      pending: dashboardData?.pendingOrders ?? 0,
      change: dashboardData?.previousPeriodComparison?.orderCountChange ?? 0,
    },
    products: {
      total: productsData?.total ?? 0,
      lowStock: (lowStockData?.products?.length ?? 0) + (lowStockData?.variants?.length ?? 0),
    },
    customers: {
      total: dashboardData?.customerCount ?? 0,
      change: dashboardData?.previousPeriodComparison?.customerCountChange ?? 0,
    },
  };

  // Transform sales data for chart
  const chartData = (salesData ?? []).map((item) => ({
    date: item.period,
    revenue: item.revenue,
    orders: item.orderCount,
  }));

  // Transform top products for bar list
  const topProductsList = (topProducts ?? []).map((item) => ({
    name: item.productName || "Unknown Product",
    value: item.totalQuantity,
  }));

  // Transform order status for donut chart
  const orderStatusData = (ordersByStatus ?? []).map((item) => ({
    status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    count: item.count,
  }));

  // Placeholder data for empty states
  const placeholderChartData = [
    { date: "No data", revenue: 0, orders: 0 },
  ];

  const placeholderTopProducts = [
    { name: "No sales data", value: 0 },
  ];

  const placeholderOrderStatus = [
    { status: "No orders", count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time overview of your store performance.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={statsLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card className="p-4" decoration="top" decorationColor="indigo">
          <Flex alignItems="start">
            <div>
              <Text>Total Revenue</Text>
              <Metric>{formatCurrency(stats.revenue.total)}</Metric>
            </div>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </Flex>
          <Flex className="mt-4 space-x-2">
            {stats.revenue.change >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <Text color={stats.revenue.change >= 0 ? "green" : "red"}>
              {stats.revenue.change.toFixed(1)}% from last period
            </Text>
          </Flex>
        </Card>

        <Card className="p-4" decoration="top" decorationColor="blue">
          <Flex alignItems="start">
            <div>
              <Text>Orders</Text>
              <Metric>{stats.orders.total}</Metric>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </Flex>
          <Flex className="mt-4 space-x-2">
            <Text color="amber">{stats.orders.pending} pending</Text>
          </Flex>
        </Card>

        <Card className="p-4" decoration="top" decorationColor="emerald">
          <Flex alignItems="start">
            <div>
              <Text>Products</Text>
              <Metric>{stats.products.total}</Metric>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </Flex>
          <Flex className="mt-4 space-x-2">
            <Text color={stats.products.lowStock > 0 ? "red" : "green"}>
              {stats.products.lowStock} low stock
            </Text>
          </Flex>
        </Card>

        <Card className="p-4" decoration="top" decorationColor="violet">
          <Flex alignItems="start">
            <div>
              <Text>Customers</Text>
              <Metric>{stats.customers.total}</Metric>
            </div>
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <Users className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
          </Flex>
          <Flex className="mt-4 space-x-2">
            {stats.customers.change >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <Text color={stats.customers.change >= 0 ? "green" : "red"}>
              {stats.customers.change.toFixed(1)}% from last period
            </Text>
          </Flex>
        </Card>
      </Grid>

      {/* Charts Row */}
      <Grid numItemsMd={2} className="gap-6">
        {/* Revenue Chart */}
        <Card className="p-4">
          <Title>Revenue Overview</Title>
          <Text>Last 30 days</Text>
          <AreaChart
            className="mt-4 h-72"
            data={chartData.length > 0 ? chartData : placeholderChartData}
            index="date"
            categories={["revenue"]}
            colors={["indigo"]}
            valueFormatter={(value) => formatCurrency(value)}
            showAnimation
          />
        </Card>

        {/* Orders by Status */}
        <Card className="p-4">
          <Title>Orders by Status</Title>
          <Text>All time distribution</Text>
          <DonutChart
            className="mt-4 h-72"
            data={orderStatusData.length > 0 ? orderStatusData : placeholderOrderStatus}
            category="count"
            index="status"
            colors={["amber", "blue", "violet", "emerald", "rose"]}
            showAnimation
          />
        </Card>
      </Grid>

      {/* Bottom Row */}
      <Grid numItemsMd={2} className="gap-6">
        {/* Top Products */}
        <Card className="p-4">
          <Title>Top Selling Products</Title>
          <Text>By units sold this month</Text>
          <BarList
            data={topProductsList.length > 0 ? topProductsList : placeholderTopProducts}
            className="mt-4"
            color="indigo"
          />
        </Card>

        {/* Inventory Status */}
        <Card className="p-4">
          <Title>Inventory Status</Title>
          <Text>Stock levels overview</Text>
          <div className="mt-4 space-y-4">
            <div>
              <Flex>
                <Text>In Stock</Text>
                <Text>
                  {Math.max(0, stats.products.total - stats.products.lowStock)} products
                </Text>
              </Flex>
              <ProgressBar
                value={
                  stats.products.total > 0
                    ? ((stats.products.total - stats.products.lowStock) /
                        stats.products.total) *
                      100
                    : 100
                }
                color="emerald"
                className="mt-2"
              />
            </div>
            <div>
              <Flex>
                <Text>Low Stock</Text>
                <Text>{stats.products.lowStock} products</Text>
              </Flex>
              <ProgressBar
                value={
                  stats.products.total > 0
                    ? (stats.products.lowStock / stats.products.total) * 100
                    : 0
                }
                color="amber"
                className="mt-2"
              />
            </div>
          </div>

          {/* Low Stock Items */}
          {lowStockData && (lowStockData.products.length > 0 || lowStockData.variants.length > 0) && (
            <div className="mt-4 pt-4 border-t">
              <Text className="font-medium mb-2">Items needing attention:</Text>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {lowStockData.products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate">{product.name}</span>
                    <span className="text-red-500 font-medium">{product.stockQuantity} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </Grid>
    </div>
  );
}
