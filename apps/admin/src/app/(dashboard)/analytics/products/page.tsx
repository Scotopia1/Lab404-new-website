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
  Badge as TremorBadge,
} from "@tremor/react";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
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
import { useTopProducts, useTopCategories, useProductAnalytics } from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";

export default function ProductAnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");

  const { data: topProducts } = useTopProducts(10);
  const { data: topCategories } = useTopCategories(5);
  const { data: productStats } = useProductAnalytics();

  const categoryData =
    topCategories?.map((c) => ({
      name: c.name,
      value: c.revenue,
    })) || [];

  const stockStatusData = [
    { name: "In Stock", value: productStats?.activeProducts || 298 },
    { name: "Low Stock", value: productStats?.lowStock || 23 },
    { name: "Out of Stock", value: productStats?.outOfStock || 8 },
  ];

  // Mock data for product performance
  const performanceData = [
    { name: "Arduino Uno R3", views: 4520, sales: 250, conversion: 5.5 },
    { name: "Raspberry Pi 4", views: 3890, sales: 98, conversion: 2.5 },
    { name: "ESP32 Dev Board", views: 3210, sales: 360, conversion: 11.2 },
    { name: "LCD Display 16x2", views: 2870, sales: 280, conversion: 9.8 },
    { name: "Servo Motor SG90", views: 2540, sales: 420, conversion: 16.5 },
  ];

  // Low stock items
  const lowStockItems = [
    { name: "Arduino Nano", sku: "ARD-NANO-01", stock: 5, threshold: 10 },
    { name: "Stepper Motor 28BYJ", sku: "MOT-28BYJ-01", stock: 3, threshold: 15 },
    { name: "DHT22 Sensor", sku: "SEN-DHT22-01", stock: 8, threshold: 20 },
    { name: "OLED Display 128x64", sku: "DIS-OLED-01", stock: 2, threshold: 10 },
    { name: "L298N Motor Driver", sku: "DRV-L298N-01", stock: 4, threshold: 12 },
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
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
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
            <Text className="text-muted-foreground">Total Products</Text>
            <Metric className="mt-1">{productStats?.totalProducts || 342}</Metric>
          </div>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </Flex>
          <div className="mt-4">
            <Text className="text-muted-foreground">Active Products</Text>
            <Metric className="mt-1">{productStats?.activeProducts || 298}</Metric>
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
            <Metric className="mt-1">{productStats?.lowStock || 23}</Metric>
          </div>
        </Card>

        <Card className="p-6">
          <Flex alignItems="start">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Box className="h-5 w-5 text-purple-600" />
            </div>
          </Flex>
          <div className="mt-4">
            <Text className="text-muted-foreground">Stock Value</Text>
            <Metric className="mt-1">
              {formatCurrency(productStats?.stockValue || 45680)}
            </Metric>
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
          {topProducts?.map((product, index) => (
            <div
              key={product.id}
              className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0"
            >
              <div className="col-span-1 text-muted-foreground">{index + 1}</div>
              <div className="col-span-4 font-medium">{product.name}</div>
              <div className="col-span-2 text-right">
                {formatCurrency(product.revenue)}
              </div>
              <div className="col-span-2 text-right">{product.quantity}</div>
              <div className="col-span-3">
                <ProgressBar
                  value={Math.min(100, (product.revenue / 15000) * 100)}
                  color="blue"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Product Performance & Low Stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <Title>Product Conversion Rates</Title>
          <Text className="text-muted-foreground">
            Views to purchase conversion
          </Text>
          <BarChart
            className="mt-6 h-72"
            data={performanceData}
            index="name"
            categories={["conversion"]}
            colors={["blue"]}
            valueFormatter={(value) => `${value}%`}
            layout="vertical"
            showLegend={false}
          />
        </Card>

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
                  <div className="text-sm text-muted-foreground">{item.sku}</div>
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
      </div>
    </div>
  );
}
