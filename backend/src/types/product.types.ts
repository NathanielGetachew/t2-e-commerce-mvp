import { z } from 'zod';

// Product schema
export const productSchema = z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    singlePriceCents: z.number().int().positive('Price must be positive'),
    currency: z.string().default('USD'),
    stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
    categoryId: z.string().optional(),
    images: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

// Bulk tier schema
export const bulkTierSchema = z.object({
    minQty: z.number().int().positive('Minimum quantity must be positive'),
    maxQty: z.number().int().positive().optional().nullable(),
    unitPriceCents: z.number().int().positive('Unit price must be positive'),
});

export type BulkTierInput = z.infer<typeof bulkTierSchema>;

// Product with bulk tiers schema
export const productWithTiersSchema = productSchema.extend({
    bulkTiers: z.array(bulkTierSchema).optional(),
});

export type ProductWithTiersInput = z.infer<typeof productWithTiersSchema>;

// Product update schema (all fields optional)
export const productUpdateSchema = productSchema.partial();

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// Product proposal schema
export const productProposalSchema = z.object({
    type: z.enum(['add', 'remove', 'update']),
    productData: z.object({}).passthrough().optional(), // Flexible object for product data
    targetProductId: z.string().optional(),
});

export type ProductProposalInput = z.infer<typeof productProposalSchema>;

// Proposal action schema
export const proposalActionSchema = z.object({
    action: z.enum(['approve', 'reject']),
});

export type ProposalActionInput = z.infer<typeof proposalActionSchema>;
