"use client";

import { useState } from "react";
import Link from "next/link";
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
  Plus,
  AlertTriangle,
  UserCheck,
  CreditCard,
  Clock,
} from "lucide-react";
import { api, ApiResponse } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDashboardStats,
  useSalesData,
  useOrdersByStatus,
  useTopProducts,
  useRecentOrders,
  useRevenueBreakdown,
  usePaymentMethods,
  useCustomerAnalytics,
  useLowStock,
  AnalyticsParams,
} from "@/hooks/use-analytics";

// Additional interfaces for products count
interface ProductCountApiResponse {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<string>("month");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Convert date range to API params
  const getDateParams = (range: string): AnalyticsParams => {
    switch (range) {
      case "today":
        return { period: "today" };
      case "yesterday":
        return { period: "yesterday" };
      case "week":
        return { period: "week" };
      case "month":
        return { period: "month" };
      case "quarter":
        return { period: "quarter" };
      case "year":
        return { period: "year" };
      default:
        return { period: "month" };
    }
  };

  const dateParams = getDateParams(dateRange);

  // Fetch all data using the analytics hooks
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(dateParams);
  const { data: salesData, refetch: refetchSales } = useSalesData({ ...dateParams, groupBy: "day" });
  const { data: ordersByStatus, refetch: refetchOrderStatus } = useOrdersByStatus(dateParams);
  const { data: topProducts, refetch: refetchTopProducts } = useTopProducts(5, dateParams);
  const { data: recentOrders, refetch: refetchRecentOrders } = useRecentOrders(5, dateParams);
  const { data: revenueBreakdown, refetch: refetchRevenue } = useRevenueBreakdown(dateParams);
  const { data: paymentMethods, refetch: refetchPayments } = usePaymentMethods(dateParams);
  const { data: customerStats, refetch: refetchCustomers } = useCustomerAnalytics(dateParams);
  const { data: lowStockData, refetch: refetchLowStock } = useLowStock(10);

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
    refetchOrderStatus();
    refetchTopProducts();
    refetchRecentOrders();
    refetchRevenue();
    refetchPayments();
    refetchCustomers();
    refetchLowStock();
    setLastUpdated(new Date());
  };

  // Calculate derived metrics
  const totalProducts = productsData?.total ?? 0;
  const lowStockCount = (lowStockData?.products?.length ?? 0) + (lowStockData?.variants?.length ?? 0);
  const outOfStockCount = (lowStockData?.products?.filter(p => p.stockQuantity === 0).length ?? 0) +
                          (lowStockData?.variants?.filter(v => v.stockQuantity === 0).length ?? 0);
  const inStockCount = Math.max(0, totalProducts - lowStockCount);

  // Payment methods data
  const paymentMethodData = paymentMethods?.map((pm) => ({
    name: pm.paymentMethod.toUpperCase(),
    value: pm.revenue,
    orders: pm.orderCount,
  })) || [];

  const totalPaymentRevenue = paymentMethods?.reduce((sum, pm) => sum + pm.revenue, 0) || 0;

  // Transform sales data for dual-axis chart
  const chartData = salesData?.map((d) => ({
    date: d.period,
    revenue: d.revenue,
    orders: d.orderCount,
  })) || [];

  // Transform order status for donut chart
  const orderStatusData = ordersByStatus?.map((item) => ({
    status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    count: item.count,
    value: item.totalValue,
  })) || [];

  // Calculate total orders for percentages
  const totalOrders = ordersByStatus?.reduce((sum, o) => sum + o.count, 0) || 1;

  // Transform top products
  const topProductsList = topProducts?.map((item) => ({
    name: item.productName || "Unknown Product",
    value: item.totalRevenue,
    quantity: item.totalQuantity,
  })) || [];

  // Format last updated time
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your store.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="quarter">Last 90 days</SelectItem>
                <SelectItem value="year">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
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
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Button asChild size="sm">
            <Link href="/orders/new">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">
              View Orders
            </Link>
          </Button>
          <div className="ml-auto text-xs text-muted-foreground">
            Last updated: {formatLastUpdated(lastUpdated)}
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        {/* Total Revenue */}
        <Card className="p-6" decoration="top" decorationColor="indigo">
          <Flex alignItems="start">
            <div className="flex-1">
              <Text className="text-muted-foreground">Total Revenue</Text>
              <Metric className="mt-1">{formatCurrency(stats?.totalRevenue || 0)}</Metric>
            </div>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-indigo-600" />
            </div>
          </Flex>
          {stats?.previousPeriodComparison && (
            <Flex className="mt-4">
              {stats.previousPeriodComparison.revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <Text className={stats.previousPeriodComparison.revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(Math.round(stats.previousPeriodComparison.revenueChange * 10) / 10)}% from last period
              </Text>
            </Flex>
          )}
        </Card>

        {/* Total Orders */}
        <Card className="p-6" decoration="top" decorationColor="blue">
          <Flex alignItems="start">
            <div className="flex-1">
              <Text className="text-muted-foreground">Total Orders</Text>
              <Metric className="mt-1">{stats?.orderCount || 0}</Metric>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
          </Flex>
          <Flex className="mt-4">
            <Text className="text-amber-600">{stats?.pendingOrders || 0} pending</Text>
            {stats?.previousPeriodComparison && (
              <>
                {stats.previousPeriodComparison.orderCountChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </>
            )}
          </Flex>
        </Card>

        {/* Average Order Value */}
        <Card className="p-6" decoration="top" decorationColor="emerald">
          <Flex alignItems="start">
            <div className="flex-1">
              <Text className="text-muted-foreground">Avg Order Value</Text>
              <Metric className="mt-1">{formatCurrency(stats?.averageOrderValue || 0)}</Metric>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </Flex>
          <Flex className="mt-4">
            <Text className="text-muted-foreground">
              Per transaction
            </Text>
          </Flex>
        </Card>

        {/* Customers */}
        <Card className="p-6" decoration="top" decorationColor="violet">
          <Flex alignItems="start">
            <div className="flex-1">
              <Text className="text-muted-foreground">Customers</Text>
              <Metric className="mt-1">{stats?.customerCount || 0}</Metric>
            </div>
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
          </Flex>
          {stats?.previousPeriodComparison && (
            <Flex className="mt-4">
              {stats.previousPeriodComparison.customerCountChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <Text className={stats.previousPeriodComparison.customerCountChange >= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(Math.round(stats.previousPeriodComparison.customerCountChange * 10) / 10)}% from last period
              </Text>
            </Flex>
          )}
        </Card>
      </Grid>

      {/* Revenue Analytics Row */}
      <Grid numItemsMd={2} className="gap-6">
        {/* Revenue Over Time - Dual Axis */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title>Revenue Over Time</Title>
              <Text className="text-muted-foreground">Revenue and order trends</Text>
            </div>
          </div>
          <AreaChart
            className="h-72"
            data={chartData}
            index="date"
            categories={["revenue"]}
            colors={["indigo"]}
            valueFormatter={(value) => formatCurrency(value)}
            showLegend={false}
            showGridLines={false}
          />
        </Card>

        {/* Revenue Breakdown & Payment Methods */}
        <Card className="p-6">
          <Title>Revenue Breakdown</Title>
          <Text className="text-muted-foreground">Components of total revenue</Text>

          <div className="mt-6 space-y-3">
            <Flex>
              <Text>Subtotal</Text>
              <Text className="font-medium">{formatCurrency(revenueBreakdown?.subtotal || 0)}</Text>
            </Flex>
            <Flex>
              <Text>Tax</Text>
              <Text className="font-medium">{formatCurrency(revenueBreakdown?.taxAmount || 0)}</Text>
            </Flex>
            <Flex>
              <Text>Shipping</Text>
              <Text className="font-medium">{formatCurrency(revenueBreakdown?.shippingAmount || 0)}</Text>
            </Flex>
            <Flex>
              <Text>Discounts</Text>
              <Text className="font-medium text-red-600">-{formatCurrency(revenueBreakdown?.discountAmount || 0)}</Text>
            </Flex>
            <div className="border-t pt-3 mt-3">
              <Flex>
                <Text className="font-semibold">Total</Text>
                <Text className="font-semibold">{formatCurrency(revenueBreakdown?.total || 0)}</Text>
              </Flex>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <Flex className="mb-4">
              <Text className="font-medium">Payment Methods</Text>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </Flex>
            <div className="space-y-2">
              {paymentMethodData.slice(0, 3).map((method, i) => {
                const percentage = totalPaymentRevenue > 0
                  ? ((method.value / totalPaymentRevenue) * 100).toFixed(1)
                  : 0;
                return (
                  <Flex key={method.name}>
                    <Text className="text-sm">{method.name}</Text>
                    <Text className="text-sm font-medium">{percentage}%</Text>
                  </Flex>
                );
              })}
            </div>
          </div>
        </Card>
      </Grid>

      {/* Activity & Performance Row */}
      <Grid numItemsMd={2} className="gap-6">
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title>Recent Orders</Title>
              <Text className="text-muted-foreground">Latest transactions</Text>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders">View All →</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentOrders?.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Text className="font-medium">{order.orderNumber}</Text>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "success"
                          : order.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <Text className="text-sm text-muted-foreground">{order.customer}</Text>
                </div>
                <div className="text-right">
                  <Text className="font-medium">{formatCurrency(order.total)}</Text>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <div className="py-8 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent orders</p>
              </div>
            )}
          </div>
        </Card>

        {/* Orders by Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title>Orders by Status</Title>
              <Text className="text-muted-foreground">Status distribution</Text>
            </div>
          </div>
          <DonutChart
            className="h-48"
            data={orderStatusData}
            category="count"
            index="status"
            colors={["amber", "blue", "indigo", "violet", "emerald", "rose"]}
            valueFormatter={(value) => value.toString()}
            showLabel
          />
          <div className="mt-4 space-y-2">
            {ordersByStatus?.map((order) => {
              const percentage = totalOrders > 0 ? ((order.count / totalOrders) * 100).toFixed(1) : 0;
              return (
                <Flex key={order.status}>
                  <Text className="capitalize text-sm">{order.status}</Text>
                  <Text className="text-sm">
                    {order.count} <span className="text-muted-foreground">({percentage}%)</span>
                  </Text>
                </Flex>
              );
            })}
          </div>
        </Card>
      </Grid>

      {/* Products & Customer Insights Row */}
      <Grid numItemsMd={2} className="gap-6">
        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title>Top Products</Title>
              <Text className="text-muted-foreground">By revenue</Text>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">View All →</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {topProductsList.map((product, index) => (
              <div key={product.name} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="font-medium truncate">{product.name}</Text>
                  <Text className="text-xs text-muted-foreground">{product.quantity} units sold</Text>
                </div>
                <Text className="font-medium">{formatCurrency(product.value)}</Text>
              </div>
            ))}
            {topProductsList.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No product data</p>
              </div>
            )}
          </div>
        </Card>

        {/* Customer Insights */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title>Customer Insights</Title>
              <Text className="text-muted-foreground">Customer breakdown</Text>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/analytics/customers">View Details →</Link>
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Flex className="mb-2">
                <Text>Total Customers</Text>
                <Text className="font-semibold">{customerStats?.totalCustomers || 0}</Text>
              </Flex>
            </div>
            <div>
              <Flex className="mb-2">
                <Text>Registered</Text>
                <Text className="font-medium text-blue-600">
                  {customerStats?.registeredCustomers || 0}
                  {customerStats?.totalCustomers && customerStats.totalCustomers > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({Math.round((customerStats.registeredCustomers / customerStats.totalCustomers) * 100)}%)
                    </span>
                  )}
                </Text>
              </Flex>
              <ProgressBar
                value={
                  customerStats?.totalCustomers
                    ? (customerStats.registeredCustomers / customerStats.totalCustomers) * 100
                    : 0
                }
                color="blue"
              />
            </div>
            <div>
              <Flex className="mb-2">
                <Text>Guest</Text>
                <Text className="font-medium text-gray-600">
                  {customerStats?.guestCustomers || 0}
                  {customerStats?.totalCustomers && customerStats.totalCustomers > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({Math.round((customerStats.guestCustomers / customerStats.totalCustomers) * 100)}%)
                    </span>
                  )}
                </Text>
              </Flex>
              <ProgressBar
                value={
                  customerStats?.totalCustomers
                    ? (customerStats.guestCustomers / customerStats.totalCustomers) * 100
                    : 0
                }
                color="gray"
              />
            </div>
            <div className="pt-3 border-t">
              <Flex>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <Text>Active Customers</Text>
                </div>
                <Text className="font-medium text-green-600">
                  {customerStats?.customersWithOrders || 0}
                </Text>
              </Flex>
            </div>
          </div>
        </Card>
      </Grid>

      {/* Alerts & Inventory Section */}
      {lowStockCount > 0 && (
        <Card className="p-6 border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Title>Inventory Alerts</Title>
                  <Text className="text-muted-foreground">Products needing attention</Text>
                </div>
                <Badge variant="warning" className="text-sm">
                  {lowStockCount} items
                </Badge>
              </div>

              <Grid numItemsMd={3} className="gap-4 mb-4">
                <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border">
                  <Flex>
                    <Text className="text-sm">In Stock</Text>
                    <Text className="text-sm font-medium text-green-600">{inStockCount}</Text>
                  </Flex>
                  <ProgressBar value={totalProducts > 0 ? (inStockCount / totalProducts) * 100 : 0} color="green" className="mt-2" />
                </div>
                <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border">
                  <Flex>
                    <Text className="text-sm">Low Stock</Text>
                    <Text className="text-sm font-medium text-amber-600">{lowStockCount}</Text>
                  </Flex>
                  <ProgressBar value={totalProducts > 0 ? (lowStockCount / totalProducts) * 100 : 0} color="amber" className="mt-2" />
                </div>
                <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border">
                  <Flex>
                    <Text className="text-sm">Out of Stock</Text>
                    <Text className="text-sm font-medium text-red-600">{outOfStockCount}</Text>
                  </Flex>
                  <ProgressBar value={totalProducts > 0 ? (outOfStockCount / totalProducts) * 100 : 0} color="red" className="mt-2" />
                </div>
              </Grid>

              <div className="space-y-2">
                <Text className="font-medium text-sm mb-2">Items needing restocking:</Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {lowStockData?.products.slice(0, 6).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-950 rounded border text-sm">
                      <span className="text-muted-foreground truncate flex-1">{product.name}</span>
                      <span className="text-amber-600 font-medium ml-2">{product.stockQuantity} left</span>
                    </div>
                  ))}
                  {lowStockData?.variants.slice(0, 6 - (lowStockData?.products.length || 0)).map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-950 rounded border text-sm">
                      <span className="text-muted-foreground truncate flex-1">
                        {variant.productName} - {Object.values(variant.options || {}).join(", ")}
                      </span>
                      <span className="text-amber-600 font-medium ml-2">{variant.stockQuantity} left</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/analytics/products">View All Low Stock Items →</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
