/**
 * Cart Service - Shopping Cart & Wishlist Management
 */

const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3005;

// Redis for cart caching
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Cart Schema
const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    products: [{
        productId: { type: String, required: true },
        name: String,
        imageUrl: String,
        price: Number,
        quantity: { type: Number, default: 1, min: 1 },
        vendorId: String
    }],
    wishlist: [{
        productId: { type: String, required: true },
        addedAt: { type: Date, default: Date.now }
    }],
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'cart-service' });
});

// Get cart
app.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Try Redis cache first
        const cached = await redis.get(`cart:${userId}`);
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = { userId, products: [], wishlist: [] };
        }

        // Cache for 10 minutes
        await redis.setex(`cart:${userId}`, 600, JSON.stringify({ cart, products: cart.products }));

        res.json({ cart, products: cart.products });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ success: false, error: 'Failed to get cart' });
    }
});

// Add to cart
app.post('/:userId/items', async (req, res) => {
    try {
        const { userId } = req.params;
        const { productId, name, imageUrl, price, quantity = 1, vendorId } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, products: [] });
        }

        const existingItem = cart.products.find(p => p.productId === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.products.push({ productId, name, imageUrl, price, quantity, vendorId });
        }

        await cart.save();
        await redis.del(`cart:${userId}`);

        res.json({ success: true, cart });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, error: 'Failed to add to cart' });
    }
});

// Update cart item
app.put('/:userId/items/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const { quantity } = req.body;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, error: 'Cart not found' });
        }

        const item = cart.products.find(p => p.productId === productId);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        if (quantity <= 0) {
            cart.products = cart.products.filter(p => p.productId !== productId);
        } else {
            item.quantity = quantity;
        }

        await cart.save();
        await redis.del(`cart:${userId}`);

        res.json({ success: true, cart });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ success: false, error: 'Failed to update cart' });
    }
});

// Remove from cart
app.delete('/:userId/items/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;

        const cart = await Cart.findOneAndUpdate(
            { userId },
            { $pull: { products: { productId } } },
            { new: true }
        );

        await redis.del(`cart:${userId}`);

        res.json({ success: true, cart });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ success: false, error: 'Failed to remove item' });
    }
});

// Clear cart
app.delete('/:userId/clear', async (req, res) => {
    try {
        const { userId } = req.params;

        await Cart.findOneAndUpdate({ userId }, { $set: { products: [] } });
        await redis.del(`cart:${userId}`);

        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ success: false, error: 'Failed to clear cart' });
    }
});

// Wishlist routes
app.get('/:userId/wishlist', async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.params.userId });
        res.json({ success: true, wishlist: cart?.wishlist || [] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get wishlist' });
    }
});

app.post('/:userId/wishlist', async (req, res) => {
    try {
        const { userId } = req.params;
        const { productId } = req.body;

        await Cart.findOneAndUpdate(
            { userId },
            { $addToSet: { wishlist: { productId } } },
            { upsert: true }
        );

        res.json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add to wishlist' });
    }
});

app.delete('/:userId/wishlist/:productId', async (req, res) => {
    try {
        await Cart.findOneAndUpdate(
            { userId: req.params.userId },
            { $pull: { wishlist: { productId: req.params.productId } } }
        );
        res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to remove from wishlist' });
    }
});

// Start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoharvest_carts')
    .then(() => {
        console.log('🛒 Cart Service connected to MongoDB');
        app.listen(PORT, () => console.log(`🛒 Cart Service running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to start Cart Service:', err);
        process.exit(1);
    });

module.exports = app;
