import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { ProposalService } from '../services/proposal.service';
import { ResponseHandler } from '../utils/responses';
import { logger } from '../utils/logger';
import { getFileUrl } from '../utils/upload';

export class ProductController {
    /**
     * GET /api/products
     * Get all products with optional filtering
     */
    static async getProducts(req: Request, res: Response): Promise<Response> {
        try {
            const { isActive, categoryId, page = '1', limit = '20' } = req.query;

            const result = await ProductService.getProducts(
                isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                categoryId as string,
                parseInt(page as string),
                parseInt(limit as string)
            );

            return ResponseHandler.success(res, {
                products: result.products,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total: result.total,
                    pages: Math.ceil(result.total / parseInt(limit as string)),
                },
            });
        } catch (error: any) {
            logger.error('Get products error:', error);
            return ResponseHandler.error(res, 'Failed to get products');
        }
    }

    /**
     * GET /api/products/search
     * Search products
     */
    static async searchProducts(req: Request, res: Response): Promise<Response> {
        try {
            const { q, page = '1', limit = '20' } = req.query;

            if (!q) {
                return ResponseHandler.error(res, 'Search query is required', 400);
            }

            const result = await ProductService.searchProducts(
                q as string,
                parseInt(page as string),
                parseInt(limit as string)
            );

            return ResponseHandler.success(res, {
                products: result.products,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total: result.total,
                    pages: Math.ceil(result.total / parseInt(limit as string)),
                },
            });
        } catch (error: any) {
            logger.error('Search products error:', error);
            return ResponseHandler.error(res, 'Failed to search products');
        }
    }

    /**
     * GET /api/products/:id
     * Get product by ID
     */
    static async getProduct(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;

            const product = await ProductService.getProductById(id);

            if (!product) {
                return ResponseHandler.notFound(res, 'Product not found');
            }

            return ResponseHandler.success(res, { product });
        } catch (error: any) {
            logger.error('Get product error:', error);
            return ResponseHandler.error(res, 'Failed to get product');
        }
    }

    /**
     * GET /api/products/slug/:slug
     * Get product by slug
     */
    static async getProductBySlug(req: Request, res: Response): Promise<Response> {
        try {
            const { slug } = req.params;

            const product = await ProductService.getProductBySlug(slug);

            if (!product) {
                return ResponseHandler.notFound(res, 'Product not found');
            }

            return ResponseHandler.success(res, { product });
        } catch (error: any) {
            logger.error('Get product by slug error:', error);
            return ResponseHandler.error(res, 'Failed to get product');
        }
    }

    /**
     * POST /api/products
     * Create a new product (Admin only)
     */
    static async createProduct(req: Request, res: Response): Promise<Response> {
        try {
            const { bulkTiers, ...productData } = req.body;

            const product = await ProductService.createProduct(productData, bulkTiers);

            return ResponseHandler.success(res, { product }, 'Product created successfully', 201);
        } catch (error: any) {
            logger.error('Create product error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to create product', 400);
        }
    }

    /**
     * PATCH /api/products/:id
     * Update a product (Admin only)
     */
    static async updateProduct(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { bulkTiers, ...productData } = req.body;

            const product = await ProductService.updateProduct(id, productData, bulkTiers);

            return ResponseHandler.success(res, { product }, 'Product updated successfully');
        } catch (error: any) {
            logger.error('Update product error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to update product', 400);
        }
    }

    /**
     * DELETE /api/products/:id
     * Delete a product (Admin only) - soft delete
     */
    static async deleteProduct(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;

            await ProductService.deleteProduct(id);

            return ResponseHandler.success(res, null, 'Product deleted successfully');
        } catch (error: any) {
            logger.error('Delete product error:', error);
            return ResponseHandler.error(res, 'Failed to delete product');
        }
    }

    /**
     * POST /api/products/upload-image
     * Upload product image
     */
    static async uploadImage(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.file) {
                return ResponseHandler.error(res, 'No file uploaded', 400);
            }

            const imageUrl = getFileUrl(req.file.filename);

            return ResponseHandler.success(res, { url: imageUrl }, 'Image uploaded successfully');
        } catch (error: any) {
            logger.error('Upload image error:', error);
            return ResponseHandler.error(res, 'Failed to upload image');
        }
    }

    /**
     * POST /api/products/proposals
     * Create a product proposal
     */
    static async createProposal(req: Request, res: Response): Promise<Response> {
        try {
            const { type, productData, targetProductId } = req.body;
            const userId = req.user!.userId;

            const proposal = await ProposalService.createProposal(
                type,
                productData,
                targetProductId,
                userId
            );

            return ResponseHandler.success(res, { proposal }, 'Proposal created successfully', 201);
        } catch (error: any) {
            logger.error('Create proposal error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to create proposal', 400);
        }
    }

    /**
     * GET /api/products/proposals
     * Get all proposals (Admin only)
     */
    static async getProposals(req: Request, res: Response): Promise<Response> {
        try {
            const { status } = req.query;

            const proposals = await ProposalService.getProposals(
                status as 'pending' | 'approved' | 'rejected' | undefined
            );

            return ResponseHandler.success(res, { proposals });
        } catch (error: any) {
            logger.error('Get proposals error:', error);
            return ResponseHandler.error(res, 'Failed to get proposals');
        }
    }

    /**
     * PATCH /api/products/proposals/:id
     * Approve or reject a proposal (Super Admin only)
     */
    static async handleProposal(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { action } = req.body;
            const userId = req.user!.userId;

            let proposal;
            if (action === 'approve') {
                proposal = await ProposalService.approveProposal(id, userId);
            } else if (action === 'reject') {
                proposal = await ProposalService.rejectProposal(id, userId);
            } else {
                return ResponseHandler.error(res, 'Invalid action', 400);
            }

            return ResponseHandler.success(res, { proposal }, `Proposal ${action}ed successfully`);
        } catch (error: any) {
            logger.error('Handle proposal error:', error);
            return ResponseHandler.error(res, error.message || 'Failed to handle proposal', 400);
        }
    }
}
