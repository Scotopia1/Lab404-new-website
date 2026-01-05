"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  Title,
  Text,
  AreaChart,
  DonutChart,
  BarList,
} from "@tremor/react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Download,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useDashboardStats,
  useSalesData,
  useOrdersByStatus,
  useTopProducts,
  useRecentOrders,
  AnalyticsParams,
} from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

const statusColors: Record<string, string> = {
  pending: "amber",
  confirmed: "blue",
  processing: "indigo",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>("month");
  const [isExporting, setIsExporting] = useState(false);

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

  // Fetch data with date params
  const { data: stats, isLoading: statsLoading } = useDashboardStats(dateParams);
  const { data: salesData, isLoading: salesLoading } = useSalesData(dateParams);
  const { data: ordersByStatus } = useOrdersByStatus(dateParams);
  const { data: topProducts } = useTopProducts(5, dateParams);
  const { data: recentOrders } = useRecentOrders(5, dateParams);

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await api.get("/analytics/export", {
        params: dateParams,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `analytics-${dateRange}-${new Date().toISOString().split("T")[0]}.json`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Analytics data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export analytics data");
    } finally {
      setIsExporting(false);
    }
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: stats?.totalRevenue || 0,
      change: stats?.previousPeriodComparison?.revenueChange || 0,
      icon: DollarSign,
      format: "currency" as const,
    },
    {
      title: "Total Orders",
      value: stats?.orderCount || 0,
      change: stats?.previousPeriodComparison?.orderCountChange || 0,
      icon: ShoppingCart,
      format: "number" as const,
    },
    {
      title: "Total Customers",
      value: stats?.customerCount || 0,
      change: stats?.previousPeriodComparison?.customerCountChange || 0,
      icon: Users,
      format: "number" as const,
    },
    {
      title: "Avg. Order Value",
      value: stats?.averageOrderValue || 0,
      change: 0, // Not provided by API yet
      icon: TrendingUp,
      format: "currency" as const,
    },
  ];

  const productBarData =
    topProducts?.map((p) => ({
      name: p.productName,
      value: p.totalRevenue,
    })) || [];

  const donutData =
    ordersByStatus?.map((o) => ({
      name: o.status.charAt(0).toUpperCase() + o.status.slice(1),
      value: o.count,
    })) || [];

  // Format sales data for chart
  const chartData = salesData?.map((d) => ({
    date: d.period,
    revenue: d.revenue,
  })) || [];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your store performance
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
            onClick={handleExport}
            variant="outline"
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              {stat.change !== 0 && (
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(Math.round(stat.change * 10) / 10)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <Text className="text-muted-foreground">{stat.title}</Text>
              <Title className="text-2xl font-bold mt-1">
                {stat.format === "currency"
                  ? formatCurrency(stat.value)
                  : stat.value.toLocaleString()}
              </Title>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <Title>Revenue Over Time</Title>
          <Text className="text-muted-foreground">Revenue for the selected period</Text>
          <AreaChart
            className="mt-6 h-72"
            data={chartData}
            index="date"
            categories={["revenue"]}
            colors={["blue"]}
            valueFormatter={(value) => formatCurrency(value)}
            showLegend={false}
            showGridLines={false}
          />
        </Card>

        <Card className="p-6">
          <Title>Orders by Status</Title>
          <Text className="text-muted-foreground">Distribution of order statuses</Text>
          <DonutChart
            className="mt-6 h-48"
            data={donutData}
            category="value"
            index="name"
            colors={["amber", "blue", "indigo", "purple", "green", "red"]}
            valueFormatter={(value) => value.toString()}
            showLabel
          />
          <div className="mt-4 space-y-2">
            {ordersByStatus?.map((order) => (
              <div key={order.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full bg-${statusColors[order.status]}-500`}
                  />
                  <span className="text-sm capitalize">{order.status}</span>
                </div>
                <span className="text-sm font-medium">{order.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Products and Orders Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title>Top Products</Title>
              <Text className="text-muted-foreground">By revenue</Text>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/analytics/products">View All</Link>
            </Button>
          </div>
          <BarList
            data={productBarData}
            valueFormatter={(value: number) => formatCurrency(value)}
            className="mt-4"
          />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title>Recent Orders</Title>
              <Text className="text-muted-foreground">Latest transactions</Text>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/orders">View All</Link>
            </Button>
          </div>
          <div className="space-y-4 mt-4">
            {recentOrders?.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{order.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.customer}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(order.total)}</div>
                  <Badge
                    variant={
                      order.status === "delivered"
                        ? "success"
                        : order.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <Title>Sales Analytics</Title>
              <Text className="text-muted-foreground">
                Deep dive into sales trends and revenue metrics
              </Text>
            </div>
            <Button asChild>
              <Link href="/analytics/sales">View</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <Title>Product Analytics</Title>
              <Text className="text-muted-foreground">
                Stock levels and inventory insights
              </Text>
            </div>
            <Button asChild>
              <Link href="/analytics/products">View</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <Title>Customer Analytics</Title>
              <Text className="text-muted-foreground">
                Customer behavior and top spenders
              </Text>
            </div>
            <Button asChild>
              <Link href="/analytics/customers">View</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
