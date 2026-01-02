/**
 * Export Service
 * Handles data export in various formats (CSV, JSON, XLSX)
 */

interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
}

export class ExportService {
  /**
   * Export data to CSV format
   */
  toCSV<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn<T>[]
  ): string {
    if (data.length === 0) {
      return columns.map(c => c.header).join(',');
    }

    // Header row
    const headers = columns.map(c => this.escapeCSV(c.header));

    // Data rows
    const rows = data.map(row => {
      return columns.map(col => {
        const value = this.getNestedValue(row, col.key as string);
        const formatted = col.formatter ? col.formatter(value, row) : value;
        return this.escapeCSV(String(formatted ?? ''));
      });
    });

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Export data to JSON format
   */
  toJSON<T>(data: T[], pretty = true): string {
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * Export data to JSONL format (JSON Lines - one object per line)
   */
  toJSONL<T>(data: T[]): string {
    return data.map(row => JSON.stringify(row)).join('\n');
  }

  /**
   * Get export content type and file extension
   */
  getContentType(format: 'csv' | 'json' | 'jsonl' | 'xlsx'): {
    contentType: string;
    extension: string;
  } {
    switch (format) {
      case 'csv':
        return { contentType: 'text/csv', extension: 'csv' };
      case 'json':
        return { contentType: 'application/json', extension: 'json' };
      case 'jsonl':
        return { contentType: 'application/x-ndjson', extension: 'jsonl' };
      case 'xlsx':
        return { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' };
      default:
        return { contentType: 'application/octet-stream', extension: 'bin' };
    }
  }

  /**
   * Get export filename
   */
  getFilename(prefix: string, format: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `${prefix}-export-${date}.${format}`;
  }

  // ===========================================
  // Predefined Export Configurations
  // ===========================================

  /**
   * Product export columns
   */
  getProductColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'slug', header: 'Slug' },
      { key: 'sku', header: 'SKU' },
      { key: 'description', header: 'Description' },
      { key: 'basePrice', header: 'Base Price', formatter: (v) => Number(v).toFixed(2) },
      { key: 'stockQuantity', header: 'Stock Quantity' },
      { key: 'categoryName', header: 'Category' },
      { key: 'brand', header: 'Brand' },
      { key: 'status', header: 'Status' },
      { key: 'isFeatured', header: 'Featured', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'createdAt', header: 'Created At', formatter: (v) => new Date(v as string).toISOString() },
    ];
  }

  /**
   * Order export columns
   */
  getOrderColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'orderNumber', header: 'Order Number' },
      { key: 'customerEmail', header: 'Customer Email' },
      { key: 'customerName', header: 'Customer Name' },
      { key: 'status', header: 'Status' },
      { key: 'paymentStatus', header: 'Payment Status' },
      { key: 'paymentMethod', header: 'Payment Method' },
      { key: 'subtotalSnapshot', header: 'Subtotal', formatter: (v) => Number(v).toFixed(2) },
      { key: 'taxAmountSnapshot', header: 'Tax', formatter: (v) => Number(v).toFixed(2) },
      { key: 'shippingAmountSnapshot', header: 'Shipping', formatter: (v) => Number(v).toFixed(2) },
      { key: 'discountAmountSnapshot', header: 'Discount', formatter: (v) => Number(v).toFixed(2) },
      { key: 'totalSnapshot', header: 'Total', formatter: (v) => Number(v).toFixed(2) },
      { key: 'currency', header: 'Currency' },
      { key: 'trackingNumber', header: 'Tracking Number' },
      { key: 'createdAt', header: 'Order Date', formatter: (v) => new Date(v as string).toISOString() },
      { key: 'shippedAt', header: 'Shipped At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'deliveredAt', header: 'Delivered At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
    ];
  }

  /**
   * Customer export columns
   */
  getCustomerColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'id', header: 'ID' },
      { key: 'email', header: 'Email' },
      { key: 'firstName', header: 'First Name' },
      { key: 'lastName', header: 'Last Name' },
      { key: 'phone', header: 'Phone' },
      { key: 'isGuest', header: 'Guest', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'isActive', header: 'Active', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'orderCount', header: 'Order Count' },
      { key: 'createdAt', header: 'Registered At', formatter: (v) => new Date(v as string).toISOString() },
    ];
  }

  /**
   * Promo code export columns
   */
  getPromoCodeColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'code', header: 'Code' },
      { key: 'description', header: 'Description' },
      { key: 'discountType', header: 'Discount Type' },
      { key: 'discountValue', header: 'Discount Value', formatter: (v) => Number(v).toFixed(2) },
      { key: 'minimumOrderAmount', header: 'Min Order Amount', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'maximumDiscount', header: 'Max Discount', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'usageLimit', header: 'Usage Limit' },
      { key: 'usageCount', header: 'Times Used' },
      { key: 'isActive', header: 'Active', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'startsAt', header: 'Start Date', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'expiresAt', header: 'Expiry Date', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
    ];
  }

  // ===========================================
  // Helper Methods
  // ===========================================

  private escapeCSV(value: string): string {
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)?.[p], obj);
  }
}

export const exportService = new ExportService();
