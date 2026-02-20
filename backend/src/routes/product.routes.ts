import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly, superAdminOnly } from '../middleware/authorize';
import { validate } from '../middleware/validation';
import {
    productWithTiersSchema,
    productUpdateSchema,
    productProposalSchema,
    proposalActionSchema,
} from '../types/product.types';
import { upload } from '../utils/upload';

const router = Router();

/**
 * @route   GET /api/products
 * @desc    Get all products (with optional filters)
 * @access  Public
 */
router.get('/', ProductController.getProducts);

/**
 * @route   GET /api/products/search
 * @desc    Search products
 * @access  Public
 */
router.get('/search', ProductController.searchProducts);

/**
 * @route   POST /api/products/proposals
 * @desc    Create a product proposal
 * @access  Admin only
 */
router.post(
    '/proposals',
    authenticate,
    adminOnly,
    validate(productProposalSchema),
    ProductController.createProposal
);

/**
 * @route   GET /api/products/proposals
 * @desc    Get all proposals
 * @access  Admin only
 */
router.get('/proposals', authenticate, adminOnly, ProductController.getProposals);

/**
 * @route   PATCH /api/products/proposals/:id
 * @desc    Approve or reject a proposal
 * @access  Super Admin only
 */
router.patch(
    '/proposals/:id',
    authenticate,
    superAdminOnly,
    validate(proposalActionSchema),
    ProductController.handleProposal
);

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get('/slug/:slug', ProductController.getProductBySlug);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', ProductController.getProduct);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin only
 */
router.post(
    '/',
    authenticate,
    adminOnly,
    validate(productWithTiersSchema),
    ProductController.createProduct
);

/**
 * @route   PATCH /api/products/:id
 * @desc    Update a product
 * @access  Admin only
 */
router.patch(
    '/:id',
    authenticate,
    adminOnly,
    validate(productUpdateSchema),
    ProductController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (soft delete)
 * @access  Admin only
 */
router.delete('/:id', authenticate, adminOnly, ProductController.deleteProduct);

/**
 * @route   POST /api/products/upload-image
 * @desc    Upload product image
 * @access  Admin only
 */
router.post(
    '/upload-image',
    authenticate,
    adminOnly,
    upload.single('file'),
    ProductController.uploadImage
);

/**
 * @route   PATCH /api/products/proposals/:id
 * @desc    Approve or reject a proposal
 * @access  Super Admin only
 */
router.patch(
    '/proposals/:id',
    authenticate,
    superAdminOnly,
    validate(proposalActionSchema),
    ProductController.handleProposal
);

export default router;
