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
   * Product export columns - ALL fields
   */
  getProductColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'id', header: 'ID' },
      { key: 'sku', header: 'SKU' },
      { key: 'barcode', header: 'Barcode' },
      { key: 'name', header: 'Name' },
      { key: 'slug', header: 'Slug' },
      { key: 'description', header: 'Description' },
      { key: 'shortDescription', header: 'Short Description' },
      { key: 'categoryId', header: 'Category ID' },
      { key: 'categoryName', header: 'Category' },
      { key: 'brand', header: 'Brand' },
      { key: 'basePrice', header: 'Base Price', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'costPrice', header: 'Cost Price', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'compareAtPrice', header: 'Compare At Price', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'weight', header: 'Weight (g)', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'dimensions', header: 'Dimensions', formatter: (v) => v ? JSON.stringify(v) : '' },
      { key: 'stockQuantity', header: 'Stock Quantity' },
      { key: 'lowStockThreshold', header: 'Low Stock Threshold' },
      { key: 'trackInventory', header: 'Track Inventory', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'allowBackorder', header: 'Allow Backorder', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'images', header: 'Images', formatter: (v) => v ? JSON.stringify(v) : '' },
      { key: 'videos', header: 'Videos', formatter: (v) => v ? JSON.stringify(v) : '' },
      { key: 'thumbnailUrl', header: 'Thumbnail URL' },
      { key: 'tags', header: 'Tags', formatter: (v) => Array.isArray(v) ? v.join(', ') : '' },
      { key: 'specifications', header: 'Specifications', formatter: (v) => v ? JSON.stringify(v) : '' },
      { key: 'features', header: 'Features', formatter: (v) => Array.isArray(v) ? v.join(', ') : '' },
      { key: 'metaTitle', header: 'Meta Title' },
      { key: 'metaDescription', header: 'Meta Description' },
      { key: 'status', header: 'Status' },
      { key: 'isFeatured', header: 'Featured', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'isDigital', header: 'Digital Product', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'requiresShipping', header: 'Requires Shipping', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'supplierId', header: 'Supplier ID' },
      { key: 'supplierSku', header: 'Supplier SKU' },
      { key: 'importedFrom', header: 'Imported From' },
      { key: 'externalUrl', header: 'External URL' },
      { key: 'createdAt', header: 'Created At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'updatedAt', header: 'Updated At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
    ];
  }

  /**
   * Order export columns - ALL fields
   */
  getOrderColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'id', header: 'ID' },
      { key: 'orderNumber', header: 'Order Number' },
      { key: 'customerId', header: 'Customer ID' },
      { key: 'customerEmail', header: 'Customer Email' },
      { key: 'customerName', header: 'Customer Name' },
      { key: 'status', header: 'Status' },
      { key: 'paymentStatus', header: 'Payment Status' },
      { key: 'paymentMethod', header: 'Payment Method' },
      { key: 'shippingAddress', header: 'Shipping Address', formatter: (v) => v ? JSON.stringify(v) : '' },
      { key: 'billingAddress', header: 'Billing Address', formatter: (v) => v ? JSON.stringify(v) : '' },
      { key: 'currency', header: 'Currency' },
      { key: 'subtotalSnapshot', header: 'Subtotal', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'taxRateSnapshot', header: 'Tax Rate', formatter: (v) => v ? (Number(v) * 100).toFixed(2) + '%' : '' },
      { key: 'taxAmountSnapshot', header: 'Tax Amount', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'shippingAmountSnapshot', header: 'Shipping', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'discountAmountSnapshot', header: 'Discount', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'totalSnapshot', header: 'Total', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'promoCodeId', header: 'Promo Code ID' },
      { key: 'promoCodeSnapshot', header: 'Promo Code Used' },
      { key: 'shippingMethod', header: 'Shipping Method' },
      { key: 'trackingNumber', header: 'Tracking Number' },
      { key: 'confirmedAt', header: 'Confirmed At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'processingAt', header: 'Processing At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'shippedAt', header: 'Shipped At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'deliveredAt', header: 'Delivered At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'customerNotes', header: 'Customer Notes' },
      { key: 'adminNotes', header: 'Admin Notes' },
      { key: 'createdAt', header: 'Order Date', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'updatedAt', header: 'Updated At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
    ];
  }

  /**
   * Customer export columns - ALL fields
   */
  getCustomerColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'id', header: 'ID' },
      { key: 'authUserId', header: 'Auth User ID' },
      { key: 'email', header: 'Email' },
      { key: 'firstName', header: 'First Name' },
      { key: 'lastName', header: 'Last Name' },
      { key: 'phone', header: 'Phone' },
      { key: 'defaultShippingAddress', header: 'Default Shipping Address', formatter: (v) => v ? JSON.stringify(v) : '' },
      { key: 'defaultBillingAddress', header: 'Default Billing Address', formatter: (v) => v ? JSON.stringify(v) : '' },
      { key: 'isGuest', header: 'Guest', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'isActive', header: 'Active', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'acceptsMarketing', header: 'Accepts Marketing', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'notes', header: 'Notes' },
      { key: 'tags', header: 'Tags', formatter: (v) => Array.isArray(v) ? v.join(', ') : '' },
      { key: 'orderCount', header: 'Order Count' },
      { key: 'createdAt', header: 'Registered At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'updatedAt', header: 'Updated At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
    ];
  }

  /**
   * Promo code export columns - ALL fields
   */
  getPromoCodeColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'id', header: 'ID' },
      { key: 'code', header: 'Code' },
      { key: 'description', header: 'Description' },
      { key: 'discountType', header: 'Discount Type' },
      { key: 'discountValue', header: 'Discount Value', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'minimumOrderAmount', header: 'Min Order Amount', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'maximumDiscountAmount', header: 'Max Discount Amount', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'usageLimit', header: 'Usage Limit' },
      { key: 'usageCount', header: 'Times Used' },
      { key: 'usageLimitPerCustomer', header: 'Usage Limit Per Customer' },
      { key: 'isActive', header: 'Active', formatter: (v) => v ? 'Yes' : 'No' },
      { key: 'startsAt', header: 'Start Date', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'expiresAt', header: 'Expiry Date', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'appliesToProducts', header: 'Applies To Products', formatter: (v) => Array.isArray(v) ? v.join(', ') : '' },
      { key: 'appliesToCategories', header: 'Applies To Categories', formatter: (v) => Array.isArray(v) ? v.join(', ') : '' },
      { key: 'customerIds', header: 'Restricted Customer IDs', formatter: (v) => Array.isArray(v) ? v.join(', ') : '' },
      { key: 'createdAt', header: 'Created At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'updatedAt', header: 'Updated At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
    ];
  }

  /**
   * Quotation export columns - ALL fields
   */
  getQuotationColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'id', header: 'ID' },
      { key: 'quotationNumber', header: 'Quotation Number' },
      { key: 'customerId', header: 'Customer ID' },
      { key: 'customerName', header: 'Customer Name' },
      { key: 'customerEmail', header: 'Customer Email' },
      { key: 'customerPhone', header: 'Customer Phone' },
      { key: 'customerCompany', header: 'Customer Company' },
      { key: 'customerAddress', header: 'Customer Address', formatter: (v) => v ? JSON.stringify(v) : '' },
      { key: 'status', header: 'Status' },
      { key: 'validUntil', header: 'Valid Until', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'validDays', header: 'Valid Days' },
      { key: 'currency', header: 'Currency' },
      { key: 'subtotal', header: 'Subtotal', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'taxRate', header: 'Tax Rate', formatter: (v) => v ? (Number(v) * 100).toFixed(2) + '%' : '' },
      { key: 'taxAmount', header: 'Tax Amount', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'discountType', header: 'Discount Type' },
      { key: 'discountValue', header: 'Discount Value', formatter: (v) => v ? Number(v).toFixed(2) : '' },
      { key: 'discountAmount', header: 'Discount Amount', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'total', header: 'Total', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'notes', header: 'Notes' },
      { key: 'termsAndConditions', header: 'Terms & Conditions' },
      { key: 'pdfUrl', header: 'PDF URL' },
      { key: 'pdfTemplateId', header: 'PDF Template ID' },
      { key: 'convertedToOrderId', header: 'Converted To Order ID' },
      { key: 'acceptanceToken', header: 'Acceptance Token' },
      { key: 'tokenExpiresAt', header: 'Token Expires At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'viewedAt', header: 'Viewed At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'createdAt', header: 'Created At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
      { key: 'updatedAt', header: 'Updated At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
    ];
  }

  /**
   * Order Items export columns
   */
  getOrderItemColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'id', header: 'ID' },
      { key: 'orderId', header: 'Order ID' },
      { key: 'orderNumber', header: 'Order Number' },
      { key: 'productId', header: 'Product ID' },
      { key: 'variantId', header: 'Variant ID' },
      { key: 'productNameSnapshot', header: 'Product Name' },
      { key: 'skuSnapshot', header: 'SKU' },
      { key: 'variantOptionsSnapshot', header: 'Variant Options', formatter: (v) => v ? JSON.stringify(v) : '' },
      { key: 'quantity', header: 'Quantity' },
      { key: 'unitPriceSnapshot', header: 'Unit Price', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'lineTotal', header: 'Line Total', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'createdAt', header: 'Created At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
    ];
  }

  /**
   * Quotation Items export columns
   */
  getQuotationItemColumns(): ExportColumn<Record<string, unknown>>[] {
    return [
      { key: 'id', header: 'ID' },
      { key: 'quotationId', header: 'Quotation ID' },
      { key: 'quotationNumber', header: 'Quotation Number' },
      { key: 'productId', header: 'Product ID' },
      { key: 'variantId', header: 'Variant ID' },
      { key: 'name', header: 'Item Name' },
      { key: 'description', header: 'Description' },
      { key: 'sku', header: 'SKU' },
      { key: 'quantity', header: 'Quantity' },
      { key: 'unitPrice', header: 'Unit Price', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'lineTotal', header: 'Line Total', formatter: (v) => v ? Number(v).toFixed(2) : '0.00' },
      { key: 'createdAt', header: 'Created At', formatter: (v) => v ? new Date(v as string).toISOString() : '' },
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
