/**
 * Product Service - Main Entry Point
 * Handles product catalog, inventory, and categories
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { createLogger } = require('./utils/logger');
const { connectToRabbitMQ, subscribeToEvents } = require('./utils/messaging');

const app = express();
const PORT = process.env.PORT || 3003;
const logger = createLogger('product-service');

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'product-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
app.use('/', productRoutes);
app.use('/products', productRoutes);
app.use('/api/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/api/categories', categoryRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const startServer = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoharvest_products';
        await mongoose.connect(mongoUri);
        logger.info('Connected to MongoDB');

        await connectToRabbitMQ();
        await subscribeToEvents();
        logger.info('Message queue connected');

        app.listen(PORT, () => {
            logger.info(`
╔════════════════════════════════════════════════════════════╗
║   📦 Product Service Started                               ║
║   Port: ${PORT}                                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
╚════════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await mongoose.disconnect();
    process.exit(0);
});

startServer();

module.exports = app;
