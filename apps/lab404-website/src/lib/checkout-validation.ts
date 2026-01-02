import { z } from 'zod';

export const checkoutSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().min(2, 'State must be at least 2 characters'),
    zipCode: z.string().min(5, 'Zip code must be at least 5 characters'),
    country: z.string().min(2, 'Country must be at least 2 characters'),
    cardNumber: z.string().min(16, 'Card number must be 16 digits').max(16),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Invalid expiry date (MM/YY)'),
    cvc: z.string().min(3, 'CVC must be 3 digits').max(4),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
