"use client";

import { useState } from "react";
import {
  Card,
  Title,
  Text,
  LineChart,
  DonutChart,
  Metric,
  Flex,
  AreaChart,
} from "@tremor/react";
import {
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useCustomerAnalytics,
  useNewCustomers,
  AnalyticsParams,
} from "@/hooks/use-analytics";

export default function CustomerAnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>("month");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  // Convert date range to API params
  const getDateParams = (range: string): AnalyticsParams => {
    switch (range) {
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

  const { data: customerStats } = useCustomerAnalytics(dateParams);
  const { data: newCustomersData } = useNewCustomers(dateParams);

  // Calculate new customers in period
  const newCustomersCount = newCustomersData?.reduce((sum, d) => sum + d.total, 0) || 0;
  const newRegisteredCount = newCustomersData?.reduce((sum, d) => sum + d.registered, 0) || 0;
  const newGuestsCount = newCustomersData?.reduce((sum, d) => sum + d.guests, 0) || 0;

  // Calculate percentages
  const registeredPercentage = customerStats?.totalCustomers
    ? Math.round((customerStats.registeredCustomers / customerStats.totalCustomers) * 100)
    : 0;

  const activePercentage = customerStats?.totalCustomers
    ? Math.round((customerStats.customersWithOrders / customerStats.totalCustomers) * 100)
    : 0;

  // Format data for charts
  const customerGrowthData = newCustomersData?.map((d) => ({
    period: d.period,
    registered: d.registered,
    guests: d.guests,
    total: d.total,
  })) || [];

  const distributionData = [
    { name: "Registered", value: customerStats?.registeredCustomers || 0 },
    { name: "Guest", value: customerStats?.guestCustomers || 0 },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Analytics</h1>
          <p className="text-muted-foreground">
            Customer insights and behavioral analysis
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
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </Flex>
          <div className="mt-4">
            <Text className="text-muted-foreground">Total Customers</Text>
            <Metric className="mt-1">{customerStats?.totalCustomers || 0}</Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              All time customers
            </Text>
          </div>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserPlus className="h-5 w-5 text-green-600" />
            </div>
          </Flex>
          <div className="mt-4">
            <Text className="text-muted-foreground">New Customers</Text>
            <Metric className="mt-1">{newCustomersCount}</Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              In selected period
            </Text>
          </div>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
          </Flex>
          <div className="mt-4">
            <Text className="text-muted-foreground">Registered</Text>
            <Metric className="mt-1">{customerStats?.registeredCustomers || 0}</Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              {registeredPercentage}% of total
            </Text>
          </div>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <UserCheck className="h-5 w-5 text-amber-600" />
            </div>
          </Flex>
          <div className="mt-4">
            <Text className="text-muted-foreground">Active Customers</Text>
            <Metric className="mt-1">{customerStats?.customersWithOrders || 0}</Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              {activePercentage}% with orders
            </Text>
          </div>
        </Card>
      </div>

      {/* Customer Growth Chart */}
      <Card className="p-6">
        <Title>New Customers Over Time</Title>
        <Text className="text-muted-foreground">
          Guest vs Registered customer growth
        </Text>
        <AreaChart
          className="mt-6 h-80"
          data={customerGrowthData}
          index="period"
          categories={["registered", "guests"]}
          colors={["blue", "gray"]}
          valueFormatter={(value) => value.toString()}
          showLegend
          showGridLines={false}
        />
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <Text className="text-muted-foreground">Total New</Text>
            <Metric className="mt-1">{newCustomersCount}</Metric>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <Text className="text-muted-foreground">Registered</Text>
            <Metric className="mt-1 text-blue-600">{newRegisteredCount}</Metric>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <Text className="text-muted-foreground">Guests</Text>
            <Metric className="mt-1 text-gray-600">{newGuestsCount}</Metric>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Distribution */}
        <Card className="p-6">
          <Title>Customer Distribution</Title>
          <Text className="text-muted-foreground">
            Customer type breakdown
          </Text>
          <DonutChart
            className="mt-6 h-52"
            data={distributionData}
            category="value"
            index="name"
            colors={["blue", "gray"]}
            valueFormatter={(value) => value.toString()}
            showLabel
          />
          <div className="mt-4 space-y-2">
            <Flex>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <Text>Registered Customers</Text>
              </div>
              <Text className="font-medium">
                {customerStats?.registeredCustomers || 0} ({registeredPercentage}%)
              </Text>
            </Flex>
            <Flex>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-500" />
                <Text>Guest Customers</Text>
              </div>
              <Text className="font-medium">
                {customerStats?.guestCustomers || 0} ({100 - registeredPercentage}%)
              </Text>
            </Flex>
          </div>
        </Card>

        {/* Customer Engagement */}
        <Card className="p-6">
          <Title>Customer Engagement</Title>
          <Text className="text-muted-foreground">
            Engagement metrics
          </Text>
          <div className="mt-6 space-y-6">
            <div>
              <Flex>
                <Text>Customers with Orders</Text>
                <Text className="font-medium">
                  {customerStats?.customersWithOrders || 0}
                </Text>
              </Flex>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${activePercentage}%` }}
                />
              </div>
              <Text className="text-xs text-muted-foreground mt-1">
                {activePercentage}% of total customers
              </Text>
            </div>

            <div>
              <Flex>
                <Text>Registered Customers</Text>
                <Text className="font-medium">
                  {customerStats?.registeredCustomers || 0}
                </Text>
              </Flex>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${registeredPercentage}%` }}
                />
              </div>
              <Text className="text-xs text-muted-foreground mt-1">
                {registeredPercentage}% of total customers
              </Text>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <Text className="text-xs text-muted-foreground">Avg Orders</Text>
                  <Text className="text-lg font-semibold mt-1">
                    {customerStats?.customersWithOrders && customerStats?.totalCustomers
                      ? (customerStats.customersWithOrders / customerStats.totalCustomers).toFixed(1)
                      : "0.0"}
                  </Text>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <Text className="text-xs text-muted-foreground">Growth Rate</Text>
                  <Text className="text-lg font-semibold mt-1">
                    {customerStats?.totalCustomers && newCustomersCount
                      ? ((newCustomersCount / customerStats.totalCustomers) * 100).toFixed(1)
                      : "0.0"}%
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>Top Customers</Title>
            <Text className="text-muted-foreground">
              Customers with most orders
            </Text>
          </div>
        </div>
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-3 border-b">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Customer</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2 text-right">Orders</div>
          </div>
          {customerStats?.topCustomers?.map((customer, index) => (
            <div
              key={customer.id}
              className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0"
            >
              <div className="col-span-1 text-muted-foreground">
                {index + 1}
              </div>
              <div className="col-span-5 font-medium">
                {customer.firstName && customer.lastName
                  ? `${customer.firstName} ${customer.lastName}`
                  : "Unknown"}
                {customer.orderCount >= 10 && (
                  <Badge className="ml-2" variant="default">
                    VIP
                  </Badge>
                )}
              </div>
              <div className="col-span-4 text-sm text-muted-foreground">
                {customer.email}
              </div>
              <div className="col-span-2 text-right font-medium">
                {customer.orderCount} orders
              </div>
            </div>
          ))}
          {(!customerStats?.topCustomers || customerStats.topCustomers.length === 0) && (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No customer data available</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
