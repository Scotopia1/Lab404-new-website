import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const registerSchema = z.object({
    firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
    lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export const trackOrderSchema = z.object({
    orderNumber: z.string().min(1, { message: "Order ID is required" }),
    email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
});

export type TrackOrderFormData = z.infer<typeof trackOrderSchema>;
