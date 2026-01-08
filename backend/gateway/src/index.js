/**
 * EcoHarvest API Gateway
 * Central entry point for all microservices
 * Handles routing, rate limiting, authentication, and load balancing
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const promClient = require('prom-client');

const app = express();
const PORT = process.env.PORT || 8000;

// ============================================
// Prometheus Metrics
// ============================================
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// ============================================
// Service Configuration
// ============================================
const SERVICES = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    users: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    products: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
    orders: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:3005',
    payments: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
    vendors: process.env.VENDOR_SERVICE_URL || 'http://localhost:3007',
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
    admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3009',
    reviews: process.env.REVIEW_SERVICE_URL || 'http://localhost:3010',
    search: process.env.SEARCH_SERVICE_URL || 'http://localhost:3011'
};

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging
app.use(morgan('combined'));

// Body parsing for non-proxied routes
app.use(express.json());

// Trust proxy
app.set('trust proxy', 1);

// Metrics middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestDuration.labels(req.method, req.path, res.statusCode).observe(duration);
        httpRequestTotal.labels(req.method, req.path, res.statusCode).inc();
    });
    next();
});

// ============================================
// Rate Limiting
// ============================================

// General rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { success: false, error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Too many authentication attempts' }
});

// ============================================
// JWT Verification Middleware
// ============================================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authorization required' });
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        req.headers['x-user-id'] = decoded.id;
        req.headers['x-user-role'] = decoded.role;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, error: 'Token expired' });
        }
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
};

// Optional auth - continues even without token
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.user = decoded;
            req.headers['x-user-id'] = decoded.id;
            req.headers['x-user-role'] = decoded.role;
        } catch (error) {
            // Token invalid, continue without user
        }
    }
    next();
};

// ============================================
// Health Check
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

// ============================================
// Proxy Configuration
// ============================================
const createProxy = (target) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (path, req) => path,
        onProxyReq: (proxyReq, req, res) => {
            // Forward user info to services
            if (req.user) {
                proxyReq.setHeader('x-user-id', req.user.id);
                proxyReq.setHeader('x-user-role', req.user.role);
            }

            // Handle body for POST/PUT/PATCH
            if (req.body && Object.keys(req.body).length > 0) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res) => {
            console.error('Proxy error:', err.message);
            res.status(503).json({
                success: false,
                error: 'Service temporarily unavailable'
            });
        }
    });
};

// ============================================
// Route Configuration
// ============================================

// Auth routes (public)
app.use('/api/auth', authLimiter, createProxy(SERVICES.auth));

// Check cookie route (public) - for session validation
app.use('/check-cookie', createProxy(SERVICES.auth));

// User routes
app.use('/api/users', generalLimiter, verifyToken, createProxy(SERVICES.users));
app.use('/customers', generalLimiter, optionalAuth, createProxy(SERVICES.users));

// Product routes (public for viewing, auth for modifying)
app.use('/api/products', generalLimiter, optionalAuth, createProxy(SERVICES.products));
app.use('/products', generalLimiter, optionalAuth, createProxy(SERVICES.products));
app.use('/categories', generalLimiter, createProxy(SERVICES.products));

// Order routes (authenticated)
app.use('/api/orders', generalLimiter, verifyToken, createProxy(SERVICES.orders));
app.use('/orders', generalLimiter, optionalAuth, createProxy(SERVICES.orders));

// Cart routes (authenticated)
app.use('/api/cart', generalLimiter, verifyToken, createProxy(SERVICES.cart));
app.use('/cart', generalLimiter, optionalAuth, createProxy(SERVICES.cart));

// Payment routes (authenticated)
app.use('/api/payments', generalLimiter, verifyToken, createProxy(SERVICES.payments));
app.use('/payments', generalLimiter, optionalAuth, createProxy(SERVICES.payments));

// Vendor routes
app.use('/api/vendors', generalLimiter, optionalAuth, createProxy(SERVICES.vendors));
app.use('/vendors', generalLimiter, optionalAuth, createProxy(SERVICES.vendors));

// Notification routes (authenticated)
app.use('/api/notifications', generalLimiter, verifyToken, createProxy(SERVICES.notifications));
app.use('/notification', generalLimiter, optionalAuth, createProxy(SERVICES.notifications));

// Admin routes (authenticated + admin role)
app.use('/api/admin', generalLimiter, verifyToken, createProxy(SERVICES.admin));
app.use('/admin', generalLimiter, optionalAuth, createProxy(SERVICES.admin));

// Review routes
app.use('/api/reviews', generalLimiter, optionalAuth, createProxy(SERVICES.reviews));
app.use('/reviews', generalLimiter, optionalAuth, createProxy(SERVICES.reviews));

// Search routes (public)
app.use('/api/search', generalLimiter, createProxy(SERVICES.search));
app.use('/search', generalLimiter, createProxy(SERVICES.search));

// ============================================
// Service Health Aggregation
// ============================================
app.get('/api/health', async (req, res) => {
    const healthChecks = {};

    for (const [name, url] of Object.entries(SERVICES)) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const response = await fetch(`${url}/health`, { signal: controller.signal });
            clearTimeout(timeoutId);

            healthChecks[name] = {
                status: response.ok ? 'healthy' : 'unhealthy',
                responseTime: null
            };
        } catch (error) {
            healthChecks[name] = {
                status: 'unreachable',
                error: error.message
            };
        }
    }

    const allHealthy = Object.values(healthChecks).every(h => h.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
        gateway: 'healthy',
        services: healthChecks,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`
    });
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
    console.error('Gateway error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal gateway error'
    });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🌿 EcoHarvest API Gateway                                ║
║                                                            ║
║   Port: ${PORT}                                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║                                                            ║
║   Endpoints:                                               ║
║   • Health:  http://localhost:${PORT}/health                  ║
║   • Metrics: http://localhost:${PORT}/metrics                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
