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
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useSalesData, useOrdersByStatus, useDashboardStats } from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";

export default function SalesAnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [compareEnabled, setCompareEnabled] = useState(false);

  const { data: salesData } = useSalesData();
  const { data: ordersByStatus } = useOrdersByStatus();
  const { data: stats } = useDashboardStats();

  // Mock additional data
  const conversionData = [
    { step: "Visited Store", count: 15420, rate: 100 },
    { step: "Viewed Product", count: 8650, rate: 56 },
    { step: "Added to Cart", count: 2180, rate: 14 },
    { step: "Checkout Started", count: 1520, rate: 10 },
    { step: "Order Completed", count: 1284, rate: 8 },
  ];

  const paymentMethodData = [
    { name: "Credit Card", value: 65 },
    { name: "PayPal", value: 20 },
    { name: "Bank Transfer", value: 10 },
    { name: "Cash on Delivery", value: 5 },
  ];

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    orders: Math.floor(Math.random() * 20) + 5,
    revenue: Math.floor(Math.random() * 2000) + 500,
  }));

  const weeklyComparison = [
    { day: "Mon", thisWeek: 4200, lastWeek: 3800 },
    { day: "Tue", thisWeek: 3800, lastWeek: 4100 },
    { day: "Wed", thisWeek: 5100, lastWeek: 4600 },
    { day: "Thu", thisWeek: 4800, lastWeek: 4200 },
    { day: "Fri", thisWeek: 6200, lastWeek: 5800 },
    { day: "Sat", thisWeek: 7500, lastWeek: 6900 },
    { day: "Sun", thisWeek: 5800, lastWeek: 5200 },
  ];

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
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
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
            <div
              className={`flex items-center gap-1 text-sm ${
                (stats?.revenueChange || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {(stats?.revenueChange || 0) >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(stats?.revenueChange || 0)}%
            </div>
          </Flex>
          <ProgressBar value={72} className="mt-4" color="blue" />
          <Text className="mt-2 text-xs text-muted-foreground">
            72% of monthly goal
          </Text>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div>
              <Text className="text-muted-foreground">Orders</Text>
              <Metric className="mt-1">{stats?.totalOrders || 0}</Metric>
            </div>
            <div
              className={`flex items-center gap-1 text-sm ${
                (stats?.ordersChange || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {(stats?.ordersChange || 0) >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(stats?.ordersChange || 0)}%
            </div>
          </Flex>
          <ProgressBar value={85} className="mt-4" color="green" />
          <Text className="mt-2 text-xs text-muted-foreground">
            85% of monthly goal
          </Text>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div>
              <Text className="text-muted-foreground">Avg Order Value</Text>
              <Metric className="mt-1">
                {formatCurrency(stats?.averageOrderValue || 0)}
              </Metric>
            </div>
            <div
              className={`flex items-center gap-1 text-sm ${
                (stats?.aovChange || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {(stats?.aovChange || 0) >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(stats?.aovChange || 0)}%
            </div>
          </Flex>
          <ProgressBar value={65} className="mt-4" color="amber" />
          <Text className="mt-2 text-xs text-muted-foreground">
            Target: $120
          </Text>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div>
              <Text className="text-muted-foreground">Conversion Rate</Text>
              <Metric className="mt-1">8.3%</Metric>
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              1.2%
            </div>
          </Flex>
          <ProgressBar value={83} className="mt-4" color="purple" />
          <Text className="mt-2 text-xs text-muted-foreground">
            Industry avg: 3.5%
          </Text>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>Revenue & Orders Over Time</Title>
            <Text className="text-muted-foreground">
              Daily breakdown for the selected period
            </Text>
          </div>
        </div>
        <AreaChart
          className="h-80"
          data={salesData || []}
          index="date"
          categories={["revenue", "orders"]}
          colors={["blue", "green"]}
          valueFormatter={(value) =>
            value > 100 ? formatCurrency(value) : value.toString()
          }
          showLegend
          showGridLines={false}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Comparison */}
        <Card className="p-6">
          <Title>Week Over Week</Title>
          <Text className="text-muted-foreground">
            Compare this week vs last week
          </Text>
          <BarChart
            className="mt-6 h-72"
            data={weeklyComparison}
            index="day"
            categories={["thisWeek", "lastWeek"]}
            colors={["blue", "gray"]}
            valueFormatter={(value) => formatCurrency(value)}
            showLegend
          />
        </Card>

        {/* Hourly Distribution */}
        <Card className="p-6">
          <Title>Orders by Hour</Title>
          <Text className="text-muted-foreground">
            Peak shopping hours today
          </Text>
          <LineChart
            className="mt-6 h-72"
            data={hourlyData}
            index="hour"
            categories={["orders"]}
            colors={["purple"]}
            valueFormatter={(value) => value.toString()}
            showLegend={false}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <Card className="p-6">
          <Title>Conversion Funnel</Title>
          <Text className="text-muted-foreground">
            Customer journey from visit to purchase
          </Text>
          <div className="mt-6 space-y-4">
            {conversionData.map((step, i) => (
              <div key={step.step}>
                <Flex>
                  <Text>{step.step}</Text>
                  <Text className="font-medium">
                    {step.count.toLocaleString()} ({step.rate}%)
                  </Text>
                </Flex>
                <ProgressBar
                  value={step.rate}
                  className="mt-2"
                  color={
                    i === 0
                      ? "blue"
                      : i === 1
                      ? "cyan"
                      : i === 2
                      ? "indigo"
                      : i === 3
                      ? "purple"
                      : "green"
                  }
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6">
          <Title>Payment Methods</Title>
          <Text className="text-muted-foreground">
            Distribution of payment types
          </Text>
          <DonutChart
            className="mt-6 h-52"
            data={paymentMethodData}
            category="value"
            index="name"
            colors={["blue", "cyan", "indigo", "violet"]}
            valueFormatter={(value) => `${value}%`}
            showLabel
          />
          <div className="mt-4 space-y-2">
            {paymentMethodData.map((method, i) => (
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
                <Text className="font-medium">{method.value}%</Text>
              </Flex>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
