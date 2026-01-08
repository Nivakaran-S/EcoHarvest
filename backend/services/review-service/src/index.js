/**
 * Review Service - Product Ratings & Reviews
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Review Schema
const reviewSchema = new mongoose.Schema({
    productId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: String,
    orderId: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    comment: { type: String, required: true },
    images: [String],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    vendorResponse: {
        comment: String,
        respondedAt: Date
    }
}, { timestamps: true });

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });

const Review = mongoose.model('Review', reviewSchema);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'review-service' });
});

// Get reviews for product
app.get('/product/:productId', async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const reviews = await Review.find({
            productId: req.params.productId,
            status: 'approved'
        })
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const stats = await Review.aggregate([
            { $match: { productId: req.params.productId, status: 'approved' } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratings: { $push: '$rating' }
                }
            }
        ]);

        const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
            star,
            count: stats[0]?.ratings?.filter(r => r === star).length || 0
        }));

        res.json({
            success: true,
            data: reviews,
            stats: {
                averageRating: stats[0]?.averageRating?.toFixed(1) || 0,
                totalReviews: stats[0]?.totalReviews || 0,
                ratingDistribution
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get reviews' });
    }
});

// Get review by ID
app.get('/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get review' });
    }
});

// Create review
app.post('/product/:productId', async (req, res) => {
    try {
        const { userId, userName, orderId, rating, title, comment, images } = req.body;

        // Check if user already reviewed this product
        const existing = await Review.findOne({
            productId: req.params.productId,
            userId: userId || req.headers['x-user-id']
        });

        if (existing) {
            return res.status(400).json({ success: false, error: 'You have already reviewed this product' });
        }

        const review = await Review.create({
            productId: req.params.productId,
            userId: userId || req.headers['x-user-id'],
            userName,
            orderId,
            rating,
            title,
            comment,
            images,
            isVerifiedPurchase: !!orderId
        });

        res.status(201).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create review' });
    }
});

// Update review
app.put('/:id', async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update review' });
    }
});

// Delete review
app.delete('/:id', async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete review' });
    }
});

// Mark review as helpful
app.post('/:id/helpful', async (req, res) => {
    try {
        await Review.findByIdAndUpdate(req.params.id, { $inc: { helpfulCount: 1 } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update' });
    }
});

// Vendor response to review
app.post('/:id/response', async (req, res) => {
    try {
        const { comment } = req.body;
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { $set: { vendorResponse: { comment, respondedAt: new Date() } } },
            { new: true }
        );
        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to respond' });
    }
});

// Get vendor reviews
app.get('/vendor/:vendorId', async (req, res) => {
    try {
        // This would query products by vendor and aggregate reviews
        res.json({ success: true, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get reviews' });
    }
});

// Start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoharvest_reviews')
    .then(() => {
        console.log('⭐ Review Service connected to MongoDB');
        app.listen(PORT, () => console.log(`⭐ Review Service running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to start Review Service:', err);
        process.exit(1);
    });

module.exports = app;
