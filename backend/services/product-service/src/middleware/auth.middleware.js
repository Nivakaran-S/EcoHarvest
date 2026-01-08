/**
 * Auth Middleware for Product Service
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.authMiddleware = (req, res, next) => {
    try {
        // Check for user ID from gateway
        const userIdHeader = req.headers['x-user-id'];
        const userRoleHeader = req.headers['x-user-role'];

        if (userIdHeader) {
            req.user = {
                id: userIdHeader,
                role: userRoleHeader
            };
            return next();
        }

        // Fallback to token verification
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
};

exports.optionalAuth = (req, res, next) => {
    try {
        const userIdHeader = req.headers['x-user-id'];
        if (userIdHeader) {
            req.user = {
                id: userIdHeader,
                role: req.headers['x-user-role']
            };
        } else {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.slice(7);
                req.user = jwt.verify(token, JWT_SECRET);
            }
        }
    } catch (error) {
        // Continue without user
    }
    next();
};

exports.authorize = (...roles) => {
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
};
