/**
 * Admin Service - Platform Administration
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Admin Profile Schema
const adminSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: String,
    email: String,
    role: { type: String, default: 'Admin' },
    permissions: [String],
    userDetails: {
        firstName: String,
        lastName: String,
        email: String,
        phoneNumber: String,
        dateOfBirth: Date,
        gender: String,
        address: String
    }
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

// Discount Schema
const discountSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: Number,
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    validFrom: Date,
    validUntil: Date,
    isActive: { type: Boolean, default: true },
    applicableCategories: [String],
    applicableProducts: [String]
}, { timestamps: true });

const Discount = mongoose.model('Discount', discountSchema);

// Advertisement Schema
const adSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    linkUrl: String,
    position: { type: String, enum: ['hero', 'sidebar', 'banner', 'popup'], default: 'banner' },
    isActive: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
}, { timestamps: true });

const Advertisement = mongoose.model('Advertisement', adSchema);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'admin-service' });
});

// Get admin info
app.get('/:userId', async (req, res) => {
    try {
        let admin = await Admin.findOne({ userId: req.params.userId });
        if (!admin) {
            admin = { id: req.params.userId, username: 'Admin', role: 'Admin', userDetails: {} };
        }
        res.json(admin);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get admin info' });
    }
});

// Dashboard stats
app.get('/dashboard/stats', async (req, res) => {
    try {
        // Mock dashboard stats
        res.json({
            success: true,
            data: {
                totalUsers: 1250,
                totalVendors: 45,
                totalProducts: 3200,
                totalOrders: 8500,
                totalRevenue: 2500000,
                pendingVendors: 5,
                lowStockProducts: 23,
                recentActivity: []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get dashboard stats' });
    }
});

// User management
app.get('/users', async (req, res) => {
    res.json({ success: true, data: [], message: 'Fetch from user service' });
});

app.put('/users/:userId/status', async (req, res) => {
    const { status } = req.body;
    res.json({ success: true, message: `User status updated to ${status}` });
});

// Vendor approval
app.get('/vendors/pending', async (req, res) => {
    res.json({ success: true, data: [] });
});

app.put('/vendors/:vendorId/approve', async (req, res) => {
    res.json({ success: true, message: 'Vendor approved' });
});

app.put('/vendors/:vendorId/reject', async (req, res) => {
    const { reason } = req.body;
    res.json({ success: true, message: 'Vendor rejected', reason });
});

// Discount management
app.get('/discounts', async (req, res) => {
    try {
        const discounts = await Discount.find().sort('-createdAt').lean();
        res.json({ success: true, data: discounts });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get discounts' });
    }
});

app.post('/discounts', async (req, res) => {
    try {
        const discount = await Discount.create(req.body);
        res.status(201).json({ success: true, data: discount });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create discount' });
    }
});

app.put('/discounts/:id', async (req, res) => {
    try {
        const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: discount });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update discount' });
    }
});

app.delete('/discounts/:id', async (req, res) => {
    try {
        await Discount.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete discount' });
    }
});

// Advertisement management
app.get('/advertisements', async (req, res) => {
    try {
        const ads = await Advertisement.find().sort('-createdAt').lean();
        res.json({ success: true, data: ads });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get ads' });
    }
});

app.post('/advertisements', async (req, res) => {
    try {
        const ad = await Advertisement.create(req.body);
        res.status(201).json({ success: true, data: ad });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create ad' });
    }
});

app.put('/advertisements/:id', async (req, res) => {
    try {
        const ad = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: ad });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update ad' });
    }
});

app.delete('/advertisements/:id', async (req, res) => {
    try {
        await Advertisement.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete ad' });
    }
});

// Reports
app.get('/reports/sales', async (req, res) => {
    res.json({ success: true, data: { daily: [], weekly: [], monthly: [] } });
});

app.get('/reports/users', async (req, res) => {
    res.json({ success: true, data: { registrations: [], activeUsers: [] } });
});

// Audit logs
app.get('/audit-logs', async (req, res) => {
    res.json({ success: true, data: [] });
});

// Start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoharvest_admin')
    .then(() => {
        console.log('⚙️ Admin Service connected to MongoDB');
        app.listen(PORT, () => console.log(`⚙️ Admin Service running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to start Admin Service:', err);
        process.exit(1);
    });

module.exports = app;
