import { z } from 'zod';

// Login schema
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Signup schema
export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
});

export type SignupInput = z.infer<typeof signupSchema>;

// Create admin schema
export const createAdminSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: z.string().optional(),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
