"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  Title,
  Text,
  BarChart,
  DonutChart,
  BarList,
  Metric,
  Flex,
  ProgressBar,
} from "@tremor/react";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Box,
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
  useTopProducts,
  useTopCategories,
  useLowStock,
  AnalyticsParams,
} from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";

export default function ProductAnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>("month");

  // Convert date range to API params
  const getDateParams = (range: string): AnalyticsParams => {
    switch (range) {
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

  const { data: topProducts } = useTopProducts(10, dateParams);
  const { data: topCategories } = useTopCategories(5, dateParams);
  const { data: lowStockData } = useLowStock(10);

  // Combine products and variants into low stock items
  const lowStockItems = [
    ...(lowStockData?.products || []).map((p) => ({
      name: p.name,
      sku: p.sku,
      stock: p.stockQuantity,
      threshold: lowStockData?.threshold || 10,
      type: "product" as const,
    })),
    ...(lowStockData?.variants || []).map((v) => ({
      name: `${v.productName} - ${Object.values(v.options || {}).join(", ")}`,
      sku: v.sku,
      stock: v.stockQuantity,
      threshold: lowStockData?.threshold || 10,
      type: "variant" as const,
    })),
  ].slice(0, 10); // Limit to top 10

  // Calculate stock stats
  const totalProducts = (lowStockData?.products?.length || 0) + (lowStockData?.variants?.length || 0);
  const lowStockCount = lowStockItems.length;

  const categoryData =
    topCategories?.map((c) => ({
      name: c.name,
      value: c.revenue,
    })) || [];

  // Stock status data (mocked for now, could be calculated from product data)
  const stockStatusData = [
    { name: "In Stock", value: Math.max(0, totalProducts - lowStockCount) },
    { name: "Low Stock", value: lowStockCount },
    { name: "Out of Stock", value: 0 },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Analytics</h1>
          <p className="text-muted-foreground">
            Inventory insights and product performance
          </p>
        </div>
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <Flex alignItems="start">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </Flex>
          <div className="mt-4">
            <Text className="text-muted-foreground">Top Products</Text>
            <Metric className="mt-1">{topProducts?.length || 0}</Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              Showing top sellers
            </Text>
          </div>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </Flex>
          <div className="mt-4">
            <Text className="text-muted-foreground">Total Revenue</Text>
            <Metric className="mt-1">
              {formatCurrency(
                topProducts?.reduce((sum, p) => sum + p.totalRevenue, 0) || 0
              )}
            </Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              From top products
            </Text>
          </div>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </Flex>
          <div className="mt-4">
            <Text className="text-muted-foreground">Low Stock</Text>
            <Metric className="mt-1">{lowStockCount}</Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              Below threshold of {lowStockData?.threshold || 10}
            </Text>
          </div>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Box className="h-5 w-5 text-purple-600" />
            </div>
          </Flex>
          <div className="mt-4">
            <Text className="text-muted-foreground">Units Sold</Text>
            <Metric className="mt-1">
              {topProducts?.reduce((sum, p) => sum + p.totalQuantity, 0) || 0}
            </Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              Total quantity sold
            </Text>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock Status */}
        <Card className="p-6">
          <Title>Stock Status</Title>
          <Text className="text-muted-foreground">
            Distribution of product availability
          </Text>
          <div className="flex items-center gap-8 mt-6">
            <DonutChart
              className="h-40 w-40"
              data={stockStatusData}
              category="value"
              index="name"
              colors={["green", "amber", "red"]}
              showLabel
            />
            <div className="flex-1 space-y-4">
              {stockStatusData.map((item, i) => (
                <Flex key={item.name}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        i === 0
                          ? "bg-green-500"
                          : i === 1
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                    />
                    <Text>{item.name}</Text>
                  </div>
                  <Text className="font-medium">{item.value}</Text>
                </Flex>
              ))}
            </div>
          </div>
        </Card>

        {/* Category Performance */}
        {categoryData.length > 0 && (
          <Card className="p-6">
            <Title>Revenue by Category</Title>
            <Text className="text-muted-foreground">
              Top performing categories
            </Text>
            <BarList
              data={categoryData}
              valueFormatter={(value: number) => formatCurrency(value)}
              className="mt-6"
            />
          </Card>
        )}

        {categoryData.length === 0 && (
          <Card className="p-6">
            <Title>Revenue by Category</Title>
            <Text className="text-muted-foreground">
              Category analytics not available
            </Text>
            <div className="mt-6 text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No category data available</p>
            </div>
          </Card>
        )}
      </div>

      {/* Top Products */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>Top Selling Products</Title>
            <Text className="text-muted-foreground">
              Products with highest revenue
            </Text>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/products">View All Products</Link>
          </Button>
        </div>
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-3 border-b">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Product</div>
            <div className="col-span-2 text-right">Revenue</div>
            <div className="col-span-2 text-right">Units Sold</div>
            <div className="col-span-3 text-right">Performance</div>
          </div>
          {topProducts?.map((product, index) => {
            const maxRevenue = Math.max(...(topProducts?.map((p) => p.totalRevenue) || [1]));
            const performance = (product.totalRevenue / maxRevenue) * 100;
            return (
              <div
                key={product.productId}
                className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0"
              >
                <div className="col-span-1 text-muted-foreground">{index + 1}</div>
                <div className="col-span-4 font-medium">{product.productName}</div>
                <div className="col-span-2 text-right">
                  {formatCurrency(product.totalRevenue)}
                </div>
                <div className="col-span-2 text-right">{product.totalQuantity}</div>
                <div className="col-span-3">
                  <ProgressBar value={performance} color="blue" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title>Low Stock Alerts</Title>
              <Text className="text-muted-foreground">
                Products needing restock
              </Text>
            </div>
            <Badge variant="warning">{lowStockItems.length} items</Badge>
          </div>
          <div className="space-y-3 mt-4">
            {lowStockItems.map((item) => (
              <div
                key={item.sku}
                className="flex items-center justify-between p-3 border rounded-lg bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30"
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    SKU: {item.sku} · {item.type}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-amber-600">
                    {item.stock} left
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Threshold: {item.threshold}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4" asChild>
            <Link href="/products?filter=low-stock">View All Low Stock</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
