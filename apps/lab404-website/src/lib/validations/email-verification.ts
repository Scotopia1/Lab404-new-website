import { z } from 'zod';

/**
 * Schema for verifying email with code
 * Used in: /verify-email page
 */
export const verifyEmailSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});

/**
 * Schema for resending verification email
 * Used in: /verify-email page, login page
 */
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long'),
});

// Export types
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>;
