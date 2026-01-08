/**
 * Auth Service - Main Entry Point
 * Handles authentication, authorization, and session management
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { createLogger } = require('./utils/logger');
const { connectToRabbitMQ } = require('./utils/messaging');

const app = express();
const PORT = process.env.PORT || 3001;
const logger = createLogger('auth-service');

// ============================================
// Middleware
// ============================================
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie-secret'));
app.use(morgan('combined'));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Too many attempts, please try again later' }
});

// ============================================
// Health Check
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================
// Routes
// ============================================
app.use('/', authRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/api/auth', authLimiter, authRoutes);

// ============================================
// Error Handling
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Database & Message Queue Connection
// ============================================
const startServer = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoharvest_auth';
        await mongoose.connect(mongoUri);
        logger.info('Connected to MongoDB');

        // Connect to RabbitMQ
        await connectToRabbitMQ();
        logger.info('Connected to RabbitMQ');

        // Start server
        app.listen(PORT, () => {
            logger.info(`
╔════════════════════════════════════════════════════════════╗
║   🔐 Auth Service Started                                  ║
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

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await mongoose.disconnect();
    process.exit(0);
});

startServer();

module.exports = app;
