/**
 * Vendor Service - Vendor Management & Analytics
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Vendor Schema
const vendorSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    entityId: { type: String, unique: true },
    businessName: { type: String, required: true },
    businessType: { type: String, enum: ['Individual', 'Company', 'Partnership'], default: 'Individual' },
    description: String,
    logo: String,
    banner: String,
    email: { type: String, required: true },
    phone: String,
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: { type: String, default: 'India' }
    },
    bankDetails: {
        accountName: String,
        accountNumber: String,
        bankName: String,
        ifscCode: String
    },
    gstNumber: String,
    panNumber: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    commissionRate: { type: Number, default: 10 },
    rating: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    documents: [{
        type: String,
        url: String,
        verified: Boolean
    }]
}, { timestamps: true });

vendorSchema.pre('save', function (next) {
    if (!this.entityId) {
        this.entityId = `VND-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
    next();
});

const Vendor = mongoose.model('Vendor', vendorSchema);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'vendor-service' });
});

// Get all vendors
app.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = status ? { status } : {};

        const vendors = await Vendor.find(query)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        res.json({ success: true, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get vendors' });
    }
});

// Get vendor by user ID (legacy format for frontend)
app.get('/:userId', async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.params.userId });
        if (!vendor) {
            return res.status(404).json({ success: false, error: 'Vendor not found' });
        }
        // Return in legacy format for frontend compatibility
        res.json([
            { businessName: vendor.businessName, email: vendor.email, phone: vendor.phone },
            { entityId: vendor.entityId, status: vendor.status }
        ]);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get vendor' });
    }
});

// Register vendor
app.post('/register', async (req, res) => {
    try {
        const { userId, businessName, email, phone, businessType, description, address, gstNumber, panNumber } = req.body;

        const existing = await Vendor.findOne({ $or: [{ userId }, { email }] });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Vendor already exists' });
        }

        const vendor = await Vendor.create({
            userId: userId || req.headers['x-user-id'],
            businessName,
            email,
            phone,
            businessType,
            description,
            address,
            gstNumber,
            panNumber
        });

        res.status(201).json({ success: true, data: vendor });
    } catch (error) {
        console.error('Register vendor error:', error);
        res.status(500).json({ success: false, error: 'Failed to register vendor' });
    }
});

// Update vendor
app.put('/:userId', async (req, res) => {
    try {
        const vendor = await Vendor.findOneAndUpdate(
            { userId: req.params.userId },
            { $set: req.body },
            { new: true }
        );
        if (!vendor) {
            return res.status(404).json({ success: false, error: 'Vendor not found' });
        }
        res.json({ success: true, data: vendor });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update vendor' });
    }
});

// Get vendor products (proxy to product service, or return from local cache)
app.get('/:vendorId/products', async (req, res) => {
    try {
        // This would normally call the product service
        res.json({ success: true, data: [], message: 'Fetch from product service' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get products' });
    }
});

// Get vendor orders
app.get('/:vendorId/orders', async (req, res) => {
    try {
        // This would normally call the order service
        res.json({ success: true, data: [], message: 'Fetch from order service' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get orders' });
    }
});

// Get vendor analytics
app.get('/:vendorId/analytics', async (req, res) => {
    try {
        const vendor = await Vendor.findOne({
            $or: [{ entityId: req.params.vendorId }, { userId: req.params.vendorId }]
        });

        if (!vendor) {
            return res.status(404).json({ success: false, error: 'Vendor not found' });
        }

        res.json({
            success: true,
            data: {
                totalSales: vendor.totalSales,
                totalOrders: vendor.totalOrders,
                totalRevenue: vendor.totalRevenue,
                balance: vendor.balance,
                rating: vendor.rating,
                commissionRate: vendor.commissionRate
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get analytics' });
    }
});

// Request payout
app.post('/:vendorId/payouts/request', async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ entityId: req.params.vendorId });
        if (!vendor) {
            return res.status(404).json({ success: false, error: 'Vendor not found' });
        }

        if (vendor.balance < 500) {
            return res.status(400).json({ success: false, error: 'Minimum payout amount is ₹500' });
        }

        // Create payout request (would integrate with payment service)
        res.json({
            success: true,
            message: 'Payout request submitted',
            data: {
                amount: vendor.balance,
                status: 'pending',
                estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to request payout' });
    }
});

// Start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoharvest_vendors')
    .then(() => {
        console.log('🏪 Vendor Service connected to MongoDB');
        app.listen(PORT, () => console.log(`🏪 Vendor Service running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to start Vendor Service:', err);
        process.exit(1);
    });

module.exports = app;
