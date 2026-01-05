"use client";

import { useState } from "react";
import {
  Card,
  Title,
  Text,
  AreaChart,
  BarChart,
  LineChart,
  DonutChart,
  Metric,
  Flex,
  ProgressBar,
} from "@tremor/react";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useSalesData,
  useOrdersByStatus,
  useDashboardStats,
  useRevenueBreakdown,
  usePaymentMethods,
  AnalyticsParams,
} from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";

export default function SalesAnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>("month");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  // Convert date range to API params
  const getDateParams = (range: string): AnalyticsParams => {
    switch (range) {
      case "today":
        return { period: "today", groupBy };
      case "week":
        return { period: "week", groupBy };
      case "month":
        return { period: "month", groupBy };
      case "quarter":
        return { period: "quarter", groupBy };
      case "year":
        return { period: "year", groupBy };
      default:
        return { period: "month", groupBy };
    }
  };

  const dateParams = getDateParams(dateRange);

  const { data: salesData } = useSalesData(dateParams);
  const { data: ordersByStatus } = useOrdersByStatus(dateParams);
  const { data: stats } = useDashboardStats(dateParams);
  const { data: revenueBreakdown } = useRevenueBreakdown(dateParams);
  const { data: paymentMethods } = usePaymentMethods(dateParams);

  // Format sales data for dual-axis chart
  const chartData = salesData?.map((d) => ({
    period: d.period,
    revenue: d.revenue,
    orders: d.orderCount,
  })) || [];

  // Revenue breakdown for stacked bar chart
  const revenueBreakdownData = revenueBreakdown ? [
    { component: "Subtotal", amount: revenueBreakdown.subtotal },
    { component: "Tax", amount: revenueBreakdown.taxAmount },
    { component: "Shipping", amount: revenueBreakdown.shippingAmount },
    { component: "Discounts", amount: -revenueBreakdown.discountAmount },
  ] : [];

  // Payment methods for donut chart
  const paymentMethodData = paymentMethods?.map((pm) => ({
    name: pm.paymentMethod.toUpperCase(),
    value: pm.revenue,
    orders: pm.orderCount,
  })) || [];

  // Calculate payment method percentages
  const totalPaymentRevenue = paymentMethods?.reduce((sum, pm) => sum + pm.revenue, 0) || 0;

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Analytics</h1>
          <p className="text-muted-foreground">
            Deep dive into sales performance and trends
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 90 days</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <Flex alignItems="start">
            <div>
              <Text className="text-muted-foreground">Total Revenue</Text>
              <Metric className="mt-1">{formatCurrency(stats?.totalRevenue || 0)}</Metric>
            </div>
            {stats?.previousPeriodComparison && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  stats.previousPeriodComparison.revenueChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stats.previousPeriodComparison.revenueChange >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(Math.round(stats.previousPeriodComparison.revenueChange * 10) / 10)}%
              </div>
            )}
          </Flex>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div>
              <Text className="text-muted-foreground">Orders</Text>
              <Metric className="mt-1">{stats?.orderCount || 0}</Metric>
            </div>
            {stats?.previousPeriodComparison && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  stats.previousPeriodComparison.orderCountChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stats.previousPeriodComparison.orderCountChange >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(Math.round(stats.previousPeriodComparison.orderCountChange * 10) / 10)}%
              </div>
            )}
          </Flex>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div>
              <Text className="text-muted-foreground">Avg Order Value</Text>
              <Metric className="mt-1">
                {formatCurrency(stats?.averageOrderValue || 0)}
              </Metric>
            </div>
          </Flex>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div>
              <Text className="text-muted-foreground">Pending Orders</Text>
              <Metric className="mt-1">{stats?.pendingOrders || 0}</Metric>
            </div>
          </Flex>
        </Card>
      </div>

      {/* Main Chart - Revenue & Orders */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>Revenue & Orders Over Time</Title>
            <Text className="text-muted-foreground">
              Breakdown for the selected period
            </Text>
          </div>
        </div>
        <AreaChart
          className="h-80"
          data={chartData}
          index="period"
          categories={["revenue"]}
          colors={["blue"]}
          valueFormatter={(value) => formatCurrency(value)}
          showLegend
          showGridLines={false}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Breakdown */}
        <Card className="p-6">
          <Title>Revenue Breakdown</Title>
          <Text className="text-muted-foreground">
            Components of total revenue
          </Text>
          <BarChart
            className="mt-6 h-72"
            data={revenueBreakdownData}
            index="component"
            categories={["amount"]}
            colors={["blue"]}
            valueFormatter={(value) => formatCurrency(Math.abs(value))}
            showLegend={false}
          />
          <div className="mt-4 space-y-2">
            <Flex>
              <Text>Subtotal</Text>
              <Text className="font-medium">
                {formatCurrency(revenueBreakdown?.subtotal || 0)}
              </Text>
            </Flex>
            <Flex>
              <Text>Tax</Text>
              <Text className="font-medium">
                {formatCurrency(revenueBreakdown?.taxAmount || 0)}
              </Text>
            </Flex>
            <Flex>
              <Text>Shipping</Text>
              <Text className="font-medium">
                {formatCurrency(revenueBreakdown?.shippingAmount || 0)}
              </Text>
            </Flex>
            <Flex>
              <Text>Discounts</Text>
              <Text className="font-medium text-red-600">
                -{formatCurrency(revenueBreakdown?.discountAmount || 0)}
              </Text>
            </Flex>
            <div className="border-t pt-2 mt-2">
              <Flex>
                <Text className="font-semibold">Total</Text>
                <Text className="font-semibold">
                  {formatCurrency(revenueBreakdown?.total || 0)}
                </Text>
              </Flex>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6">
          <Title>Payment Methods</Title>
          <Text className="text-muted-foreground">
            Revenue distribution by payment type
          </Text>
          <DonutChart
            className="mt-6 h-52"
            data={paymentMethodData}
            category="value"
            index="name"
            colors={["blue", "cyan", "indigo", "violet"]}
            valueFormatter={(value) => formatCurrency(value)}
            showLabel
          />
          <div className="mt-4 space-y-2">
            {paymentMethodData.map((method, i) => {
              const percentage = totalPaymentRevenue > 0
                ? ((method.value / totalPaymentRevenue) * 100).toFixed(1)
                : 0;
              return (
                <Flex key={method.name}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        i === 0
                          ? "bg-blue-500"
                          : i === 1
                          ? "bg-cyan-500"
                          : i === 2
                          ? "bg-indigo-500"
                          : "bg-violet-500"
                      }`}
                    />
                    <Text>{method.name}</Text>
                  </div>
                  <div className="text-right">
                    <Text className="font-medium">
                      {formatCurrency(method.value)}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {percentage}% · {method.orders} orders
                    </Text>
                  </div>
                </Flex>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Orders by Status */}
      <Card className="p-6">
        <Title>Orders by Status</Title>
        <Text className="text-muted-foreground">
          Order status distribution for the period
        </Text>
        <BarChart
          className="mt-6 h-72"
          data={ordersByStatus?.map((o) => ({
            status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
            count: o.count,
            value: o.totalValue,
          })) || []}
          index="status"
          categories={["count"]}
          colors={["blue"]}
          valueFormatter={(value) => value.toString()}
          showLegend={false}
        />
      </Card>
    </div>
  );
}
