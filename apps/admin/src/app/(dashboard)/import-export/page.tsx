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
  Tag,
  FileText,
  FileDown,
  List,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useExport,
  useImportProducts,
  useImportCustomers,
  useDownloadTemplate,
  type ExportType,
  type ExportFormat,
  type ImportResult,
} from "@/hooks/use-import-export";

type ImportType = "products" | "customers";

export default function ImportExportPage() {
  // Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");

  // Import state
  const [importType, setImportType] = useState<ImportType>("products");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Hooks
  const exportMutation = useExport();
  const importProducts = useImportProducts();
  const importCustomers = useImportCustomers();
  const downloadTemplate = useDownloadTemplate();

  const handleExport = async (type: ExportType) => {
    await exportMutation.mutateAsync({
      type,
      options: { format: exportFormat },
    });
  };

  const handleImport = async () => {
    if (!importFile) return;

    // Read file content
    const text = await importFile.text();
    setImportResult(null);

    try {
      let result;
      if (importType === "products") {
        result = await importProducts.mutateAsync({
          csvContent: text,
          options: { updateExisting },
        });
      } else {
        result = await importCustomers.mutateAsync({
          csvContent: text,
          options: { updateExisting },
        });
      }
      setImportResult(result as unknown as ImportResult);
    } catch {
      setImportResult({
        success: false,
        totalRows: 0,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [{ row: 0, field: "", message: "Import failed. Please check your file format." }],
      });
    }
  };

  const handlePreview = async () => {
    if (!importFile) return;

    const text = await importFile.text();
    setImportResult(null);

    try {
      let result;
      if (importType === "products") {
        result = await importProducts.mutateAsync({
          csvContent: text,
          options: { dryRun: true },
        });
      } else {
        result = await importCustomers.mutateAsync({
          csvContent: text,
          options: { dryRun: true },
        });
      }
      setImportResult(result as unknown as ImportResult);
    } catch {
      setImportResult({
        success: false,
        totalRows: 0,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [{ row: 0, field: "", message: "Preview failed. Please check your file format." }],
        dryRun: true,
      });
    }
  };

  const handleDownloadTemplate = async () => {
    await downloadTemplate.mutateAsync(importType);
  };

  const exportOptions = [
    {
      type: "products" as ExportType,
      icon: Package,
      title: "Products",
      description: "Export all products with complete inventory and pricing",
      color: "blue",
    },
    {
      type: "orders" as ExportType,
      icon: ShoppingCart,
      title: "Orders",
      description: "Export orders with addresses and payment details",
      color: "green",
    },
    {
      type: "order-items" as ExportType,
      icon: List,
      title: "Order Items",
      description: "Export all order line items with product details",
      color: "emerald",
    },
    {
      type: "customers" as ExportType,
      icon: Users,
      title: "Customers",
      description: "Export customers with addresses and preferences",
      color: "purple",
    },
    {
      type: "promo-codes" as ExportType,
      icon: Tag,
      title: "Promo Codes",
      description: "Export promo codes with usage and targeting rules",
      color: "orange",
    },
    {
      type: "quotations" as ExportType,
      icon: FileText,
      title: "Quotations",
      description: "Export quotations with full pricing breakdown",
      color: "cyan",
    },
    {
      type: "quotation-items" as ExportType,
      icon: ClipboardList,
      title: "Quotation Items",
      description: "Export all quotation line items with details",
      color: "sky",
    },
  ];

  const isImporting = importProducts.isPending || importCustomers.isPending;

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-muted-foreground" />
              <Title>Export Data</Title>
            </div>
            <Select
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as ExportFormat)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="jsonl">JSONL</SelectItem>
              </SelectContent>
            </Select>
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
                      : option.color === "emerald"
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : option.color === "purple"
                      ? "bg-purple-100 dark:bg-purple-900/30"
                      : option.color === "orange"
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : option.color === "cyan"
                      ? "bg-cyan-100 dark:bg-cyan-900/30"
                      : "bg-sky-100 dark:bg-sky-900/30"
                  }`}
                >
                  <option.icon
                    className={`h-6 w-6 ${
                      option.color === "blue"
                        ? "text-blue-600"
                        : option.color === "green"
                        ? "text-green-600"
                        : option.color === "emerald"
                        ? "text-emerald-600"
                        : option.color === "purple"
                        ? "text-purple-600"
                        : option.color === "orange"
                        ? "text-orange-600"
                        : option.color === "cyan"
                        ? "text-cyan-600"
                        : "text-sky-600"
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
                  disabled={exportMutation.isPending}
                >
                  {exportMutation.isPending &&
                  exportMutation.variables?.type === option.type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export
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
            <Tabs
              value={importType}
              onValueChange={(v) => {
                setImportType(v as ImportType);
                setImportFile(null);
                setImportResult(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="products">
                  <Package className="h-4 w-4 mr-2" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="customers">
                  <Users className="h-4 w-4 mr-2" />
                  Customers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="space-y-4">
                <div className="flex items-center gap-3">
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
              </TabsContent>

              <TabsContent value="customers" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Customer Import</div>
                    <Text className="text-sm text-muted-foreground">
                      Import customers from CSV file
                    </Text>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4">
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-existing"
                  checked={updateExisting}
                  onCheckedChange={(checked) =>
                    setUpdateExisting(checked as boolean)
                  }
                />
                <Label htmlFor="update-existing" className="text-sm">
                  Update existing records (by SKU/Email)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!importFile || isImporting}
                  className="flex-1"
                >
                  {isImporting && importProducts.variables?.options?.dryRun ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Preview
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  className="flex-1"
                >
                  {isImporting && !importProducts.variables?.options?.dryRun ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import {importType === "products" ? "Products" : "Customers"}
                    </>
                  )}
                </Button>
              </div>

              {importResult && (
                <div
                  className={`p-4 rounded-lg ${
                    importResult.errors && importResult.errors.length > 0
                      ? "bg-red-100 dark:bg-red-900/30"
                      : "bg-green-100 dark:bg-green-900/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.errors && importResult.errors.length > 0 ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <span
                      className={`font-medium ${
                        importResult.errors && importResult.errors.length > 0
                          ? "text-red-800 dark:text-red-200"
                          : "text-green-800 dark:text-green-200"
                      }`}
                    >
                      {importResult.dryRun ? "Preview Results" : "Import Results"}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Total rows: {importResult.totalRows}</div>
                    {!importResult.dryRun && (
                      <>
                        <div>Imported: {importResult.imported}</div>
                        <div>Updated: {importResult.updated}</div>
                        <div>Skipped: {importResult.skipped}</div>
                      </>
                    )}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-red-700 dark:text-red-300">
                          Errors ({importResult.errors.length}):
                        </div>
                        <ul className="mt-1 text-xs space-y-1 max-h-32 overflow-auto">
                          {importResult.errors.slice(0, 10).map((err, i) => (
                            <li key={i}>
                              {err.row > 0 && `Row ${err.row}: `}
                              {err.field && `${err.field} - `}
                              {err.message}
                            </li>
                          ))}
                          {importResult.errors.length > 10 && (
                            <li>...and {importResult.errors.length - 10} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <Text className="text-sm font-medium mb-2">CSV Format</Text>
                {importType === "products" ? (
                  <>
                    <Text className="text-xs text-muted-foreground">
                      Required: name, sku, price
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1">
                      Optional: barcode, description, short_description, category, brand, cost_price, compare_at_price, quantity, low_stock_threshold, track_inventory, allow_backorder, weight, dimensions, is_digital, requires_shipping, image_url, images, status, featured, meta_title, meta_description, tags, features, specifications, supplier_id, supplier_sku
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-xs text-muted-foreground">
                      Required: email
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1">
                      Optional: first_name, last_name, phone, is_active, accepts_marketing, notes, tags, shipping_* (address fields), billing_* (address fields)
                    </Text>
                  </>
                )}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-2"
                  onClick={handleDownloadTemplate}
                  disabled={downloadTemplate.isPending}
                >
                  {downloadTemplate.isPending ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-3 w-3" />
                  )}
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
