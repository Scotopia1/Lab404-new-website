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
   * Product import mapping
   */
  getProductMappings(): ColumnMapping[] {
    return [
      { csvColumn: 'Name', field: 'name', required: true },
      { csvColumn: 'SKU', field: 'sku', required: true },
      { csvColumn: 'Description', field: 'description' },
      {
        csvColumn: 'Base Price',
        field: 'basePrice',
        required: true,
        transform: (v) => parseFloat(v.replace(/[^0-9.]/g, '')),
      },
      {
        csvColumn: 'Stock Quantity',
        field: 'stockQuantity',
        transform: (v) => parseInt(v) || 0,
      },
      { csvColumn: 'Category', field: 'categoryName' },
      { csvColumn: 'Brand', field: 'brand' },
      {
        csvColumn: 'Status',
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
        csvColumn: 'Featured',
        field: 'isFeatured',
        transform: (v) => ['yes', 'true', '1'].includes(v.toLowerCase().trim()),
      },
      {
        csvColumn: 'Tags',
        field: 'tags',
        transform: (v) => v.split(',').map(t => t.trim()).filter(Boolean),
      },
      { csvColumn: 'Image URL', field: 'mainImage' },
    ];
  }

  /**
   * Product import schema
   */
  getProductSchema() {
    return z.object({
      name: z.string().min(1).max(255),
      sku: z.string().min(1).max(100),
      description: z.string().optional(),
      basePrice: z.number().positive(),
      stockQuantity: z.number().int().min(0).optional().default(0),
      categoryName: z.string().optional(),
      brand: z.string().optional(),
      status: z.enum(['active', 'draft', 'archived']).optional().default('draft'),
      isFeatured: z.boolean().optional().default(false),
      tags: z.array(z.string()).optional(),
      mainImage: z.string().url().optional(),
    });
  }

  /**
   * Customer import mapping
   */
  getCustomerMappings(): ColumnMapping[] {
    return [
      { csvColumn: 'Email', field: 'email', required: true },
      { csvColumn: 'First Name', field: 'firstName' },
      { csvColumn: 'Last Name', field: 'lastName' },
      { csvColumn: 'Phone', field: 'phone' },
    ];
  }

  /**
   * Customer import schema
   */
  getCustomerSchema() {
    return z.object({
      email: z.string().email(),
      firstName: z.string().max(100).optional(),
      lastName: z.string().max(100).optional(),
      phone: z.string().max(50).optional(),
    });
  }

  /**
   * Generate CSV template for products
   */
  getProductTemplate(): string {
    const headers = [
      'Name',
      'SKU',
      'Description',
      'Base Price',
      'Stock Quantity',
      'Category',
      'Brand',
      'Status',
      'Featured',
      'Tags',
      'Image URL',
    ];

    const exampleRow = [
      'Example Product',
      'EX-001',
      'Product description here',
      '99.99',
      '100',
      'Electronics',
      'BrandName',
      'draft',
      'No',
      'tag1,tag2',
      'https://example.com/image.jpg',
    ];

    return `${headers.join(',')}\n${exampleRow.join(',')}`;
  }

  /**
   * Generate CSV template for customers
   */
  getCustomerTemplate(): string {
    const headers = ['Email', 'First Name', 'Last Name', 'Phone'];
    const exampleRow = ['customer@example.com', 'John', 'Doe', '+1234567890'];

    return `${headers.join(',')}\n${exampleRow.join(',')}`;
  }
}

export const importService = new ImportService();
