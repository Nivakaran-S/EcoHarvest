/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authMiddleware, optionalAuth } = require('../middleware/auth.middleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/popular', productController.getPopularProducts);
router.get('/new', productController.getNewArrivals);
router.get('/search', productController.searchProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/vendor/:vendorId', productController.getProductsByVendor);
router.get('/:id', productController.getProductById);

// Protected routes (vendor/admin)
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);
router.patch('/:id/inventory', authMiddleware, productController.updateInventory);
router.patch('/:id/status', authMiddleware, productController.updateStatus);
router.post('/bulk-import', authMiddleware, productController.bulkImport);

module.exports = router;
