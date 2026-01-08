/**
 * Order Service - Main Entry Point
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const orderRoutes = require('./routes/order.routes');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8000'],
    credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'order-service',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/', orderRoutes);
app.use('/orders', orderRoutes);
app.use('/api/orders', orderRoutes);

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// Start Server
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoharvest_orders');
        console.log('📦 Order Service connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`📦 Order Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start Order Service:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
