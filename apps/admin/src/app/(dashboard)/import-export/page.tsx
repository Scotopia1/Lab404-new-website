"use client";

import { useState } from "react";
import { Card, Title, Text } from "@tremor/react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Package,
  ShoppingCart,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { toast } from "sonner";

type ExportType = "products" | "orders" | "customers";

export default function ImportExportPage() {
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  const handleExport = async (type: ExportType) => {
    setExporting(type);
    try {
      // Simulate export - in production this would call the API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create mock CSV data
      let csvContent = "";
      if (type === "products") {
        csvContent =
          "id,name,sku,price,quantity,status\n1,Arduino Uno R3,ARD-UNO-R3,29.99,150,active\n2,Raspberry Pi 4,RPI4-8GB,89.99,50,active";
      } else if (type === "orders") {
        csvContent =
          "id,order_number,customer,total,status,created_at\n1,ORD-10001,john@example.com,129.99,delivered,2024-01-15\n2,ORD-10002,jane@example.com,89.99,shipped,2024-01-16";
      } else {
        csvContent =
          "id,email,first_name,last_name,total_orders,total_spent\n1,john@example.com,John,Doe,5,450.00\n2,jane@example.com,Jane,Smith,3,280.00";
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`);
    } catch (error) {
      toast.error(`Failed to export ${type}`);
    } finally {
      setExporting(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      // Simulate import - in production this would call the API
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock successful import
      setImportResult({
        success: true,
        message: "Import completed successfully",
        count: 25,
      });
      toast.success("Products imported successfully");
    } catch (error) {
      setImportResult({
        success: false,
        message: "Import failed. Please check your file format.",
      });
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  const exportOptions = [
    {
      type: "products" as ExportType,
      icon: Package,
      title: "Products",
      description: "Export all products with inventory, pricing, and status",
      color: "blue",
    },
    {
      type: "orders" as ExportType,
      icon: ShoppingCart,
      title: "Orders",
      description: "Export order history with customer and status details",
      color: "green",
    },
    {
      type: "customers" as ExportType,
      icon: Users,
      title: "Customers",
      description: "Export customer list with order statistics",
      color: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Import / Export</h1>
        <p className="text-muted-foreground">
          Bulk data management for your store
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            <Title>Export Data</Title>
          </div>

          {exportOptions.map((option) => (
            <Card key={option.type} className="p-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    option.color === "blue"
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : option.color === "green"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-purple-100 dark:bg-purple-900/30"
                  }`}
                >
                  <option.icon
                    className={`h-6 w-6 ${
                      option.color === "blue"
                        ? "text-blue-600"
                        : option.color === "green"
                        ? "text-green-600"
                        : "text-purple-600"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{option.title}</div>
                  <Text className="text-sm text-muted-foreground">
                    {option.description}
                  </Text>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(option.type)}
                  disabled={exporting !== null}
                >
                  {exporting === option.type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Import Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <Title>Import Data</Title>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium">Product Import</div>
                  <Text className="text-sm text-muted-foreground">
                    Import products from CSV file
                  </Text>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-file">Select CSV File</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] || null);
                    setImportResult(null);
                  }}
                />
              </div>

              {importFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{importFile.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Products
                  </>
                )}
              </Button>

              {importResult && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    importResult.success
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                  }`}
                >
                  {importResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {importResult.message}
                    {importResult.count && ` (${importResult.count} products)`}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t">
                <Text className="text-sm font-medium mb-2">CSV Format</Text>
                <Text className="text-xs text-muted-foreground">
                  Required columns: name, sku, price, quantity
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  Optional columns: description, category, status, image_url
                </Text>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                  Download sample template
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
