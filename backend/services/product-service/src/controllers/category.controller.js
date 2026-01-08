/**
 * Category Controller
 */

const Category = require('../models/category.model');
const { createLogger } = require('../utils/logger');

const logger = createLogger('category-controller');

/**
 * Get all categories
 */
exports.getAllCategories = async (req, res) => {
    try {
        const { active = 'true' } = req.query;

        const query = {};
        if (active === 'true') query.isActive = true;

        const categories = await Category.find(query)
            .sort('sortOrder name')
            .lean();

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        logger.error('Get all categories error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
};

/**
 * Get category tree (hierarchical)
 */
exports.getCategoryTree = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort('sortOrder name')
            .lean();

        // Build tree structure
        const categoryMap = {};
        const tree = [];

        categories.forEach(cat => {
            categoryMap[cat._id] = { ...cat, children: [] };
        });

        categories.forEach(cat => {
            if (cat.parent) {
                const parent = categoryMap[cat.parent];
                if (parent) {
                    parent.children.push(categoryMap[cat._id]);
                }
            } else {
                tree.push(categoryMap[cat._id]);
            }
        });

        res.json({
            success: true,
            data: tree
        });
    } catch (error) {
        logger.error('Get category tree error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category tree'
        });
    }
};

/**
 * Get category by ID
 */
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'name slug');

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        logger.error('Get category by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category'
        });
    }
};

/**
 * Create category
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, description, imageUrl, icon, parent, sortOrder } = req.body;

        let level = 0;
        if (parent) {
            const parentCategory = await Category.findById(parent);
            if (parentCategory) {
                level = parentCategory.level + 1;
            }
        }

        const category = await Category.create({
            name,
            description,
            imageUrl,
            icon,
            parent,
            level,
            sortOrder
        });

        logger.info(`Category created: ${category._id}`);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        logger.error('Create category error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create category'
        });
    }
};

/**
 * Update category
 */
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        logger.error('Update category error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update category'
        });
    }
};

/**
 * Delete category
 */
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        logger.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete category'
        });
    }
};
