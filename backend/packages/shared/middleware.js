/**
 * Shared Middleware
 * Authentication, error handling, and common middleware
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { createLogger } = require('./logger');

const logger = createLogger('middleware');

/**
 * JWT Authentication Middleware
 */
function authMiddleware(options = {}) {
    const {
        secret = process.env.JWT_SECRET,
        algorithms = ['HS256'],
        optional = false
    } = options;

    return (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                if (optional) {
                    req.user = null;
                    return next();
                }
                return res.status(401).json({
                    success: false,
                    error: 'Authorization header missing'
                });
            }

            const token = authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : authHeader;

            const decoded = jwt.verify(token, secret, { algorithms });
            req.user = decoded;
            next();
        } catch (error) {
            if (optional) {
                req.user = null;
                return next();
            }

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expired'
                });
            }

            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
    };
}

/**
 * Role-based Authorization Middleware
 * @param  {...string} roles - Allowed roles
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
        }

        next();
    };
}

/**
 * Global Error Handler
 */
function errorHandler(err, req, res, next) {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            error: `${field} already exists`
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    // Custom application errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
}

/**
 * Not Found Handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`
    });
}

/**
 * Request Logger Middleware
 */
function requestLogger(serviceName) {
    return (req, res, next) => {
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info({
                service: serviceName,
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip
            });
        });

        next();
    };
}

/**
 * Rate Limiter Configuration
 */
function createRateLimiter(options = {}) {
    const defaultOptions = {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: {
            success: false,
            error: 'Too many requests, please try again later'
        },
        standardHeaders: true,
        legacyHeaders: false
    };

    return rateLimit({ ...defaultOptions, ...options });
}

/**
 * CORS Configuration
 */
function configureCors(options = {}) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
        .split(',')
        .map(origin => origin.trim());

    const defaultOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };

    return cors({ ...defaultOptions, ...options });
}

/**
 * Common middleware setup for Express app
 */
function setupMiddleware(app, serviceName) {
    // Security headers
    app.use(helmet());

    // CORS
    app.use(configureCors());

    // Body parsing
    app.use(require('express').json({ limit: '10mb' }));
    app.use(require('express').urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    app.use(requestLogger(serviceName));

    // Trust proxy (for rate limiting behind reverse proxy)
    app.set('trust proxy', 1);
}

/**
 * Async handler wrapper
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    authMiddleware,
    authorize,
    errorHandler,
    notFoundHandler,
    requestLogger,
    createRateLimiter,
    configureCors,
    setupMiddleware,
    asyncHandler,
    helmet,
    cors
};
