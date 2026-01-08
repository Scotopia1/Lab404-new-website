import { z } from 'zod';

/**
 * Checkout validation schema for COD (Cash on Delivery) orders
 *
 * This schema matches the API's addressSchema exactly.
 * No card payment fields - Lab404 uses COD payment only in v1.
 */
export const checkoutSchema = z.object({
  // Customer contact (will be sent as customerEmail to API)
  email: z.string().email('Invalid email address'),

  // Shipping address fields (match API addressSchema)
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  company: z.string().max(255).optional(),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters'),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  phone: z.string().max(50).optional(),

  // Optional customer notes
  customerNotes: z.string().max(1000).optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
