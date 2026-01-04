/**
 * Import Service
 * Handles data import from CSV files and external sources
 */

import { z } from 'zod';

export interface ImportResult<T> {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  data: T[];
}

interface ColumnMapping {
  csvColumn: string;
  field: string;
  required?: boolean;
  transform?: (value: string) => unknown;
}

export class ImportService {
  /**
   * Parse CSV string into array of objects
   */
  parseCSV(csvContent: string): Record<string, string>[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return [];
    }

    const headerLine = lines[0];
    if (!headerLine) {
      return [];
    }

    const headers = this.parseCSVLine(headerLine);
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const values = this.parseCSVLine(line);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });

      data.push(row);
    }

    return data;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Map CSV data to objects with validation
   */
  mapAndValidate<T>(
    data: Record<string, string>[],
    mappings: ColumnMapping[],
    schema: z.ZodSchema<T>
  ): ImportResult<T> {
    const result: ImportResult<T> = {
      success: true,
      totalRows: data.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      data: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const rowNumber = i + 2; // Account for header row and 0-indexing

      try {
        // Map columns
        const mapped: Record<string, unknown> = {};

        for (const mapping of mappings) {
          const value = row[mapping.csvColumn];

          if (mapping.required && (!value || value.trim() === '')) {
            throw new Error(`Missing required field: ${mapping.csvColumn}`);
          }

          if (value && value.trim() !== '') {
            mapped[mapping.field] = mapping.transform
              ? mapping.transform(value)
              : value;
          }
        }

        // Validate with schema
        const validated = schema.parse(mapped);
        result.data.push(validated);
        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.success = false;

        if (error instanceof z.ZodError) {
          error.errors.forEach(e => {
            result.errors.push({
              row: rowNumber,
              field: e.path.join('.'),
              message: e.message,
            });
          });
        } else if (error instanceof Error) {
          result.errors.push({
            row: rowNumber,
            message: error.message,
          });
        }
      }
    }

    return result;
  }

  // ===========================================
  // Predefined Import Configurations
  // ===========================================

  /**
   * Product import mapping - ALL fields
   */
  getProductMappings(): ColumnMapping[] {
    return [
      // Required fields
      { csvColumn: 'name', field: 'name', required: true },
      { csvColumn: 'sku', field: 'sku', required: true },
      {
        csvColumn: 'price',
        field: 'basePrice',
        required: true,
        transform: (v) => parseFloat(v.replace(/[^0-9.]/g, '')),
      },
      // Basic info
      { csvColumn: 'barcode', field: 'barcode' },
      { csvColumn: 'description', field: 'description' },
      { csvColumn: 'short_description', field: 'shortDescription' },
      { csvColumn: 'category', field: 'categoryName' },
      { csvColumn: 'brand', field: 'brand' },
      // Pricing
      {
        csvColumn: 'cost_price',
        field: 'costPrice',
        transform: (v) => v ? parseFloat(v.replace(/[^0-9.]/g, '')) : undefined,
      },
      {
        csvColumn: 'compare_at_price',
        field: 'compareAtPrice',
        transform: (v) => v ? parseFloat(v.replace(/[^0-9.]/g, '')) : undefined,
      },
      // Inventory
      {
        csvColumn: 'quantity',
        field: 'stockQuantity',
        transform: (v) => parseInt(v) || 0,
      },
      {
        csvColumn: 'low_stock_threshold',
        field: 'lowStockThreshold',
        transform: (v) => parseInt(v) || 5,
      },
      {
        csvColumn: 'track_inventory',
        field: 'trackInventory',
        transform: (v) => !['no', 'false', '0'].includes(v.toLowerCase().trim()),
      },
      {
        csvColumn: 'allow_backorder',
        field: 'allowBackorder',
        transform: (v) => ['yes', 'true', '1'].includes(v.toLowerCase().trim()),
      },
      // Shipping
      {
        csvColumn: 'weight',
        field: 'weight',
        transform: (v) => v ? parseFloat(v) : undefined,
      },
      {
        csvColumn: 'dimensions',
        field: 'dimensions',
        transform: (v) => {
          if (!v) return undefined;
          try {
            // Support JSON format: {"width": 10, "height": 20, "depth": 5}
            if (v.startsWith('{')) return JSON.parse(v);
            // Support simple format: 10x20x5
            const parts = v.split('x').map(p => parseFloat(p.trim()));
            if (parts.length === 3) {
              return { width: parts[0], height: parts[1], depth: parts[2] };
            }
            return undefined;
          } catch {
            return undefined;
          }
        },
      },
      {
        csvColumn: 'is_digital',
        field: 'isDigital',
        transform: (v) => ['yes', 'true', '1'].includes(v.toLowerCase().trim()),
      },
      {
        csvColumn: 'requires_shipping',
        field: 'requiresShipping',
        transform: (v) => !['no', 'false', '0'].includes(v.toLowerCase().trim()),
      },
      // Media
      { csvColumn: 'image_url', field: 'thumbnailUrl' },
      {
        csvColumn: 'images',
        field: 'images',
        transform: (v) => {
          if (!v) return [];
          try {
            if (v.startsWith('[')) return JSON.parse(v);
            // Support comma-separated URLs
            return v.split(',').map(url => ({ url: url.trim() })).filter(img => img.url);
          } catch {
            return [];
          }
        },
      },
      // Status
      {
        csvColumn: 'status',
        field: 'status',
        transform: (v) => {
          const normalized = v.toLowerCase().trim();
          if (['active', 'draft', 'archived'].includes(normalized)) {
            return normalized;
          }
          return 'draft';
        },
      },
      {
        csvColumn: 'featured',
        field: 'isFeatured',
        transform: (v) => ['yes', 'true', '1'].includes(v.toLowerCase().trim()),
      },
      // SEO
      { csvColumn: 'meta_title', field: 'metaTitle' },
      { csvColumn: 'meta_description', field: 'metaDescription' },
      // Tags and features
      {
        csvColumn: 'tags',
        field: 'tags',
        transform: (v) => v.split(',').map(t => t.trim()).filter(Boolean),
      },
      {
        csvColumn: 'features',
        field: 'features',
        transform: (v) => v.split(',').map(t => t.trim()).filter(Boolean),
      },
      {
        csvColumn: 'specifications',
        field: 'specifications',
        transform: (v) => {
          if (!v) return {};
          try {
            if (v.startsWith('{')) return JSON.parse(v);
            // Support simple format: key1:value1,key2:value2
            const specs: Record<string, string> = {};
            v.split(',').forEach(pair => {
              const [key, value] = pair.split(':').map(s => s.trim());
              if (key && value) specs[key] = value;
            });
            return specs;
          } catch {
            return {};
          }
        },
      },
      // Supplier
      { csvColumn: 'supplier_id', field: 'supplierId' },
      { csvColumn: 'supplier_sku', field: 'supplierSku' },
    ];
  }

  /**
   * Product import schema - ALL fields
   */
  getProductSchema() {
    return z.object({
      // Required
      name: z.string().min(1).max(255),
      sku: z.string().min(1).max(100),
      basePrice: z.number().positive(),
      // Basic
      barcode: z.string().max(100).optional(),
      description: z.string().optional(),
      shortDescription: z.string().max(500).optional(),
      categoryName: z.string().optional(),
      brand: z.string().max(255).optional(),
      // Pricing
      costPrice: z.number().positive().optional(),
      compareAtPrice: z.number().positive().optional(),
      // Inventory
      stockQuantity: z.number().int().min(0).optional().default(0),
      lowStockThreshold: z.number().int().min(0).optional().default(5),
      trackInventory: z.boolean().optional().default(true),
      allowBackorder: z.boolean().optional().default(false),
      // Shipping
      weight: z.number().optional(),
      dimensions: z.object({
        width: z.number().optional(),
        height: z.number().optional(),
        depth: z.number().optional(),
      }).optional(),
      isDigital: z.boolean().optional().default(false),
      requiresShipping: z.boolean().optional().default(true),
      // Media
      thumbnailUrl: z.string().url().optional(),
      images: z.array(z.object({
        url: z.string().url(),
        alt: z.string().optional(),
      })).optional(),
      // Status
      status: z.enum(['active', 'draft', 'archived']).optional().default('draft'),
      isFeatured: z.boolean().optional().default(false),
      // SEO
      metaTitle: z.string().max(255).optional(),
      metaDescription: z.string().max(500).optional(),
      // Tags and features
      tags: z.array(z.string()).optional(),
      features: z.array(z.string()).optional(),
      specifications: z.record(z.string()).optional(),
      // Supplier
      supplierId: z.string().optional(),
      supplierSku: z.string().optional(),
    });
  }

  /**
   * Customer import mapping - ALL fields including addresses
   */
  getCustomerMappings(): ColumnMapping[] {
    return [
      // Required
      { csvColumn: 'email', field: 'email', required: true },
      // Basic info
      { csvColumn: 'first_name', field: 'firstName' },
      { csvColumn: 'last_name', field: 'lastName' },
      { csvColumn: 'phone', field: 'phone' },
      // Status
      {
        csvColumn: 'is_active',
        field: 'isActive',
        transform: (v) => !['no', 'false', '0'].includes(v.toLowerCase().trim()),
      },
      {
        csvColumn: 'accepts_marketing',
        field: 'acceptsMarketing',
        transform: (v) => ['yes', 'true', '1'].includes(v.toLowerCase().trim()),
      },
      // Notes and tags
      { csvColumn: 'notes', field: 'notes' },
      {
        csvColumn: 'tags',
        field: 'tags',
        transform: (v) => v.split(',').map(t => t.trim()).filter(Boolean),
      },
      // Shipping address fields
      { csvColumn: 'shipping_first_name', field: 'shippingFirstName' },
      { csvColumn: 'shipping_last_name', field: 'shippingLastName' },
      { csvColumn: 'shipping_company', field: 'shippingCompany' },
      { csvColumn: 'shipping_address_line1', field: 'shippingAddressLine1' },
      { csvColumn: 'shipping_address_line2', field: 'shippingAddressLine2' },
      { csvColumn: 'shipping_city', field: 'shippingCity' },
      { csvColumn: 'shipping_state', field: 'shippingState' },
      { csvColumn: 'shipping_postal_code', field: 'shippingPostalCode' },
      { csvColumn: 'shipping_country', field: 'shippingCountry' },
      { csvColumn: 'shipping_phone', field: 'shippingPhone' },
      // Billing address fields
      { csvColumn: 'billing_first_name', field: 'billingFirstName' },
      { csvColumn: 'billing_last_name', field: 'billingLastName' },
      { csvColumn: 'billing_company', field: 'billingCompany' },
      { csvColumn: 'billing_address_line1', field: 'billingAddressLine1' },
      { csvColumn: 'billing_address_line2', field: 'billingAddressLine2' },
      { csvColumn: 'billing_city', field: 'billingCity' },
      { csvColumn: 'billing_state', field: 'billingState' },
      { csvColumn: 'billing_postal_code', field: 'billingPostalCode' },
      { csvColumn: 'billing_country', field: 'billingCountry' },
      { csvColumn: 'billing_phone', field: 'billingPhone' },
    ];
  }

  /**
   * Customer import schema - ALL fields
   */
  getCustomerSchema() {
    return z.object({
      // Required
      email: z.string().email(),
      // Basic
      firstName: z.string().max(100).optional(),
      lastName: z.string().max(100).optional(),
      phone: z.string().max(50).optional(),
      // Status
      isActive: z.boolean().optional().default(true),
      acceptsMarketing: z.boolean().optional().default(false),
      // Notes and tags
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      // Shipping address fields (will be combined into JSON)
      shippingFirstName: z.string().optional(),
      shippingLastName: z.string().optional(),
      shippingCompany: z.string().optional(),
      shippingAddressLine1: z.string().optional(),
      shippingAddressLine2: z.string().optional(),
      shippingCity: z.string().optional(),
      shippingState: z.string().optional(),
      shippingPostalCode: z.string().optional(),
      shippingCountry: z.string().optional(),
      shippingPhone: z.string().optional(),
      // Billing address fields (will be combined into JSON)
      billingFirstName: z.string().optional(),
      billingLastName: z.string().optional(),
      billingCompany: z.string().optional(),
      billingAddressLine1: z.string().optional(),
      billingAddressLine2: z.string().optional(),
      billingCity: z.string().optional(),
      billingState: z.string().optional(),
      billingPostalCode: z.string().optional(),
      billingCountry: z.string().optional(),
      billingPhone: z.string().optional(),
    });
  }

  /**
   * Generate CSV template for products - ALL fields
   */
  getProductTemplate(): string {
    const headers = [
      'name',
      'sku',
      'price',
      'barcode',
      'description',
      'short_description',
      'category',
      'brand',
      'cost_price',
      'compare_at_price',
      'quantity',
      'low_stock_threshold',
      'track_inventory',
      'allow_backorder',
      'weight',
      'dimensions',
      'is_digital',
      'requires_shipping',
      'image_url',
      'images',
      'status',
      'featured',
      'meta_title',
      'meta_description',
      'tags',
      'features',
      'specifications',
      'supplier_id',
      'supplier_sku',
    ];

    const exampleRow = [
      'Arduino Uno R3',
      'ARD-UNO-R3',
      '29.99',
      '123456789',
      'The Arduino Uno R3 is a microcontroller board based on the ATmega328P.',
      'Popular microcontroller board for beginners',
      'Microcontrollers',
      'Arduino',
      '15.00',
      '39.99',
      '100',
      '10',
      'Yes',
      'No',
      '25',
      '10x5x2',
      'No',
      'Yes',
      'https://example.com/arduino.jpg',
      '',
      'active',
      'Yes',
      'Arduino Uno R3 - Buy Online',
      'Shop the Arduino Uno R3 microcontroller board',
      'arduino,microcontroller,electronics',
      'Easy to program,USB powered,14 digital pins',
      'Processor:ATmega328P,Voltage:5V,Clock:16MHz',
      'SUP001',
      'ARD-001',
    ];

    return `${headers.join(',')}\n"${exampleRow.join('","')}"`;
  }

  /**
   * Generate CSV template for customers - ALL fields
   */
  getCustomerTemplate(): string {
    const headers = [
      'email',
      'first_name',
      'last_name',
      'phone',
      'is_active',
      'accepts_marketing',
      'notes',
      'tags',
      'shipping_first_name',
      'shipping_last_name',
      'shipping_company',
      'shipping_address_line1',
      'shipping_address_line2',
      'shipping_city',
      'shipping_state',
      'shipping_postal_code',
      'shipping_country',
      'shipping_phone',
      'billing_first_name',
      'billing_last_name',
      'billing_company',
      'billing_address_line1',
      'billing_address_line2',
      'billing_city',
      'billing_state',
      'billing_postal_code',
      'billing_country',
      'billing_phone',
    ];

    const exampleRow = [
      'john@example.com',
      'John',
      'Doe',
      '+1-555-123-4567',
      'Yes',
      'Yes',
      'VIP customer',
      'wholesale,priority',
      'John',
      'Doe',
      'Acme Inc',
      '123 Main Street',
      'Suite 100',
      'New York',
      'NY',
      '10001',
      'USA',
      '+1-555-123-4567',
      'John',
      'Doe',
      'Acme Inc',
      '123 Main Street',
      'Suite 100',
      'New York',
      'NY',
      '10001',
      'USA',
      '+1-555-123-4567',
    ];

    return `${headers.join(',')}\n"${exampleRow.join('","')}"`;
  }

  /**
   * Build address JSON from flat fields
   */
  buildAddressFromFlatFields(data: Record<string, unknown>, prefix: 'shipping' | 'billing'): Record<string, unknown> | null {
    const addressLine1 = data[`${prefix}AddressLine1`];
    if (!addressLine1) return null;

    return {
      firstName: data[`${prefix}FirstName`] || '',
      lastName: data[`${prefix}LastName`] || '',
      company: data[`${prefix}Company`] || undefined,
      addressLine1: addressLine1,
      addressLine2: data[`${prefix}AddressLine2`] || undefined,
      city: data[`${prefix}City`] || '',
      state: data[`${prefix}State`] || undefined,
      postalCode: data[`${prefix}PostalCode`] || undefined,
      country: data[`${prefix}Country`] || '',
      phone: data[`${prefix}Phone`] || undefined,
    };
  }
}

export const importService = new ImportService();
