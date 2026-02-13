import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ProductInput, ProductUpdateInput, BulkTierInput } from '../types/product.types';

export interface ProductResponse {
    id: string;
    slug: string;
    name: string;
    description: string;
    images: string[];
    singlePriceCents: number;
    currency: string;
    stock: number;
    isActive: boolean;
    categoryId: string | null;
    bulkTiers?: BulkTierResponse[];
    createdAt: Date;
    updatedAt: Date;
}

export interface BulkTierResponse {
    id: string;
    minQty: number;
    maxQty: number | null;
    unitPriceCents: number;
}

export class ProductService {
    /**
     * Get all products with optional filtering
     */
    static async getProducts(
        isActive?: boolean,
        categoryId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ products: ProductResponse[]; total: number }> {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (isActive !== undefined) where.isActive = isActive;
        if (categoryId) where.categoryId = categoryId;

        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
                where,
                include: {
                    bulkTiers: true,
                    category: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            products: products.map(this.formatProduct),
            total,
        };
    }

    /**
     * Get product by ID
     */
    static async getProductById(id: string): Promise<ProductResponse | null> {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                bulkTiers: true,
                category: true,
            },
        });

        if (!product) return null;

        return this.formatProduct(product);
    }

    /**
     * Get product by slug
     */
    static async getProductBySlug(slug: string): Promise<ProductResponse | null> {
        const product = await prisma.product.findUnique({
            where: { slug },
            include: {
                bulkTiers: true,
                category: true,
            },
        });

        if (!product) return null;

        return this.formatProduct(product);
    }

    /**
     * Create a new product
     */
    static async createProduct(
        data: ProductInput,
        bulkTiers?: BulkTierInput[]
    ): Promise<ProductResponse> {
        // Check if slug already exists
        const existing = await prisma.product.findUnique({
            where: { slug: data.slug },
        });

        if (existing) {
            throw new Error('Product with this slug already exists');
        }

        const product = await prisma.product.create({
            data: {
                ...data,
                bulkTiers: bulkTiers
                    ? {
                        create: bulkTiers,
                    }
                    : undefined,
            },
            include: {
                bulkTiers: true,
                category: true,
            },
        });

        logger.info(`Product created: ${product.name} (${product.id})`);

        return this.formatProduct(product);
    }

    /**
     * Update a product
     */
    static async updateProduct(
        id: string,
        data: ProductUpdateInput,
        bulkTiers?: BulkTierInput[]
    ): Promise<ProductResponse> {
        // If slug is being updated, check for conflicts
        if (data.slug) {
            const existing = await prisma.product.findFirst({
                where: {
                    slug: data.slug,
                    NOT: { id },
                },
            });

            if (existing) {
                throw new Error('Product with this slug already exists');
            }
        }

        // Update product and bulk tiers
        const product = await prisma.product.update({
            where: { id },
            data: {
                ...data,
                bulkTiers: bulkTiers
                    ? {
                        deleteMany: {}, // Remove existing tiers
                        create: bulkTiers, // Create new tiers
                    }
                    : undefined,
            },
            include: {
                bulkTiers: true,
                category: true,
            },
        });

        logger.info(`Product updated: ${product.name} (${product.id})`);

        return this.formatProduct(product);
    }

    /**
     * Delete a product (soft delete by setting isActive to false)
     */
    static async deleteProduct(id: string): Promise<void> {
        await prisma.product.update({
            where: { id },
            data: { isActive: false },
        });

        logger.info(`Product soft deleted: ${id}`);
    }

    /**
     * Hard delete a product (use with caution)
     */
    static async hardDeleteProduct(id: string): Promise<void> {
        await prisma.product.delete({
            where: { id },
        });

        logger.info(`Product permanently deleted: ${id}`);
    }

    /**
     * Search products
     */
    static async searchProducts(
        query: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ products: ProductResponse[]; total: number }> {
        const skip = (page - 1) * limit;

        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                    ],
                    isActive: true,
                },
                include: {
                    bulkTiers: true,
                    category: true,
                },
                skip,
                take: limit,
            }),
            prisma.product.count({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                    ],
                    isActive: true,
                },
            }),
        ]);

        return {
            products: products.map(this.formatProduct),
            total,
        };
    }

    /**
     * Format product response
     */
    private static formatProduct(product: any): ProductResponse {
        return {
            id: product.id,
            slug: product.slug,
            name: product.name,
            description: product.description,
            images: product.images || [],
            singlePriceCents: product.singlePriceCents,
            currency: product.currency,
            stock: product.stock,
            isActive: product.isActive,
            categoryId: product.categoryId,
            bulkTiers: product.bulkTiers?.map((tier: any) => ({
                id: tier.id,
                minQty: tier.minQty,
                maxQty: tier.maxQty,
                unitPriceCents: tier.unitPriceCents,
            })),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    }
}
