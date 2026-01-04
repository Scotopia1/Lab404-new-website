"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

// Types for export
export type ExportType = "products" | "orders" | "customers" | "promo-codes" | "quotations" | "order-items" | "quotation-items";
export type ExportFormat = "csv" | "json" | "jsonl";

export interface ExportOptions {
  format?: ExportFormat;
  startDate?: string;
  endDate?: string;
  status?: string;
}

// Types for import
export interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  dryRun?: boolean;
  data?: unknown[];
}

export interface ImportOptions {
  dryRun?: boolean;
  updateExisting?: boolean;
}

// Helper to download blob as file
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper to get file extension from format
function getExtension(format: ExportFormat): string {
  switch (format) {
    case "json":
      return "json";
    case "jsonl":
      return "jsonl";
    default:
      return "csv";
  }
}

// Export hook
export function useExport() {
  return useMutation({
    mutationFn: async ({
      type,
      options = {},
    }: {
      type: ExportType;
      options?: ExportOptions;
    }) => {
      const format = options.format || "csv";
      const params = new URLSearchParams();
      params.append("format", format);
      if (options.startDate) params.append("startDate", options.startDate);
      if (options.endDate) params.append("endDate", options.endDate);
      if (options.status) params.append("status", options.status);

      const response = await api.get(`/export/${type}?${params.toString()}`, {
        responseType: "blob",
      });

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${type}-export-${timestamp}.${getExtension(format)}`;
      downloadBlob(response.data, filename);

      return { success: true, filename };
    },
    onSuccess: (data) => {
      toast.success(`Exported successfully: ${data.filename}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Export failed");
    },
  });
}

// Import products hook
export function useImportProducts() {
  return useMutation({
    mutationFn: async ({
      csvContent,
      options = {},
    }: {
      csvContent: string;
      options?: ImportOptions;
    }): Promise<ImportResult> => {
      const response = await api.post<{ data: ImportResult }>("/import/products", {
        csvContent,
        dryRun: options.dryRun || false,
        updateExisting: options.updateExisting || false,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      if (data.dryRun) {
        toast.info(`Preview: ${data.totalRows} rows found, ${data.errors?.length || 0} errors`);
      } else {
        toast.success(
          `Import complete: ${data.imported} added, ${data.updated} updated, ${data.skipped} skipped`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Import failed");
    },
  });
}

// Import customers hook
export function useImportCustomers() {
  return useMutation({
    mutationFn: async ({
      csvContent,
      options = {},
    }: {
      csvContent: string;
      options?: ImportOptions;
    }): Promise<ImportResult> => {
      const response = await api.post<{ data: ImportResult }>("/import/customers", {
        csvContent,
        dryRun: options.dryRun || false,
        updateExisting: options.updateExisting || false,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      if (data.dryRun) {
        toast.info(`Preview: ${data.totalRows} rows found, ${data.errors?.length || 0} errors`);
      } else {
        toast.success(
          `Import complete: ${data.imported} added, ${data.updated} updated, ${data.skipped} skipped`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Import failed");
    },
  });
}

// Download template hook
export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async (type: "products" | "customers") => {
      const response = await api.get(`/import/templates/${type}`, {
        responseType: "blob",
      });
      const filename = `${type}-import-template.csv`;
      downloadBlob(response.data, filename);
      return { success: true, filename };
    },
    onSuccess: (data) => {
      toast.success(`Template downloaded: ${data.filename}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to download template");
    },
  });
}
