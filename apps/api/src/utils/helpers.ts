import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Generate a unique slug by appending a random suffix
 */
export function generateUniqueSlug(text: string): string {
  const baseSlug = generateSlug(text);
  const suffix = uuidv4().slice(0, 8);
  return `${baseSlug}-${suffix}`;
}

/**
 * Generate an order number
 * Format: LAB-YYYY-NNNN
 */
export function generateOrderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = String(sequence).padStart(4, '0');
  return `LAB-${year}-${paddedSequence}`;
}

/**
 * Generate a quotation number
 * Format: QUO-YYYY-NNNN
 */
export function generateQuotationNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = String(sequence).padStart(4, '0');
  return `QUO-${year}-${paddedSequence}`;
}

/**
 * Generate a random SKU
 * Format: LAB-XXXXXX
 */
export function generateSku(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sku = 'LAB-';
  for (let i = 0; i < 6; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sku;
}

/**
 * Round a number to specified decimal places
 */
export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Format a price with currency symbol
 */
export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Mask email address for privacy
 * example@domain.com -> e***e@domain.com
 */
export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) {return email;}

  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }

  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/**
 * Mask phone number for privacy
 * +1234567890 -> +123****890
 */
export function maskPhone(phone: string): string {
  if (phone.length < 7) {return phone;}

  const start = phone.slice(0, 3);
  const end = phone.slice(-3);
  return `${start}****${end}`;
}

/**
 * Check if a string is a valid UUID
 */
export function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Omit specified keys from an object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Pick specified keys from an object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}
