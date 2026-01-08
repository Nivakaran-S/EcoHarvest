/**
 * Product Controller
 */

const Product = require('../models/product.model');
const Category = require('../models/category.model');
const { publishEvent } = require('../utils/messaging');
const { createLogger } = require('../utils/logger');

const logger = createLogger('product-controller');

/**
 * Get all products with pagination and filters
 */
exports.getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            sort = '-createdAt',
            category,
            vendor,
            minPrice,
            maxPrice,
            status = 'In Stock',
            search
        } = req.query;

        const query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by vendor
        if (vendor) {
            query.vendorId = vendor;
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category', 'name slug')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
};

/**
 * Get product by ID
 */
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name slug');

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Increment view count
        await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        logger.error('Get product by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product'
        });
    }
};

/**
 * Create new product
 */
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            subtitle,
            description,
            price,
            originalPrice,
            quantity,
            category,
            vendorId,
            vendorName,
            imageUrl,
            images,
            tags,
            attributes,
            isOrganic
        } = req.body;

        // Get category info
        let categoryName = '';
        if (category) {
            const categoryDoc = await Category.findById(category);
            if (categoryDoc) {
                categoryName = categoryDoc.name;
            }
        }

        // Generate SKU
        const sku = `ECO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const product = await Product.create({
            name,
            subtitle,
            description,
            price,
            originalPrice,
            quantity,
            category,
            categoryName,
            vendorId: vendorId || req.user?.id,
            vendorName,
            imageUrl,
            images,
            tags,
            attributes,
            isOrganic,
            sku,
            status: quantity > 0 ? 'In Stock' : 'Out of Stock'
        });

        // Publish product created event
        await publishEvent('product.created', {
            productId: product._id,
            vendorId: product.vendorId,
            category: product.category
        });

        logger.info(`Product created: ${product._id}`);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        logger.error('Create product error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create product'
        });
    }
};

/**
 * Update product
 */
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Publish product updated event
        await publishEvent('product.updated', {
            productId: product._id,
            vendorId: product.vendorId
        });

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        logger.error('Update product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update product'
        });
    }
};

/**
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Publish product deleted event
        await publishEvent('product.deleted', {
            productId: product._id,
            vendorId: product.vendorId
        });

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        logger.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete product'
        });
    }
};

/**
 * Update inventory
 */
exports.updateInventory = async (req, res) => {
    try {
        const { quantity, operation = 'set' } = req.body;

        let update;
        if (operation === 'increment') {
            update = { $inc: { quantity: quantity } };
        } else if (operation === 'decrement') {
            update = { $inc: { quantity: -quantity } };
        } else {
            update = { $set: { quantity: quantity } };
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Check for low stock
        if (product.quantity <= product.lowStockThreshold && product.quantity > 0) {
            await publishEvent('inventory.low', {
                productId: product._id,
                vendorId: product.vendorId,
                quantity: product.quantity
            });
        }

        res.json({
            success: true,
            message: 'Inventory updated',
            data: { quantity: product.quantity, status: product.status }
        });
    } catch (error) {
        logger.error('Update inventory error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update inventory'
        });
    }
};

/**
 * Update product status
 */
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Status updated',
            data: product
        });
    } catch (error) {
        logger.error('Update status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update status'
        });
    }
};

/**
 * Get products by category
 */
exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { page = 1, limit = 20, sort = '-createdAt' } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find({ category: categoryId, status: { $in: ['In Stock', 'Active'] } })
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product.countDocuments({ category: categoryId, status: { $in: ['In Stock', 'Active'] } })
        ]);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Get products by category error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
};

/**
 * Get products by vendor
 */
exports.getProductsByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { page = 1, limit = 20, sort = '-createdAt', status } = req.query;

        const query = { vendorId };
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Get products by vendor error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
};

/**
 * Get featured products
 */
exports.getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const products = await Product.find({
            isFeatured: true,
            status: { $in: ['In Stock', 'Active'] }
        })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        logger.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch featured products'
        });
    }
};

/**
 * Get popular products (by sold count)
 */
exports.getPopularProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const products = await Product.find({
            status: { $in: ['In Stock', 'Active'] }
        })
            .sort('-soldCount -averageRating')
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        logger.error('Get popular products error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch popular products'
        });
    }
};

/**
 * Get new arrivals
 */
exports.getNewArrivals = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const products = await Product.find({
            status: { $in: ['In Stock', 'Active'] }
        })
            .sort('-createdAt')
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        logger.error('Get new arrivals error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch new arrivals'
        });
    }
};

/**
 * Search products
 */
exports.searchProducts = async (req, res) => {
    try {
        const { q, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

        const query = { status: { $in: ['In Stock', 'Active'] } };

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ];
        }

        if (category) query.category = category;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort('-averageRating -soldCount')
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Search products error:', error);
        res.status(500).json({
            success: false,
            error: 'Search failed'
        });
    }
};

/**
 * Bulk import products
 */
exports.bulkImport = async (req, res) => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Products array is required'
            });
        }

        const results = await Product.insertMany(products, { ordered: false });

        res.status(201).json({
            success: true,
            message: `Imported ${results.length} products`,
            data: { importedCount: results.length }
        });
    } catch (error) {
        logger.error('Bulk import error:', error);
        res.status(500).json({
            success: false,
            error: 'Bulk import failed'
        });
    }
};
