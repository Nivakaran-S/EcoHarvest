/**
 * Application Constants
 * Shared enums, status codes, and configuration values
 */

// User Roles
const USER_ROLES = {
    CUSTOMER: 'Customer',
    VENDOR: 'Vendor',
    ADMIN: 'Admin'
};

// Order Statuses
const ORDER_STATUS = {
    PENDING: 'Pending',
    PENDING_PAYMENT: 'Pending Payment',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded'
};

// Payment Statuses
const PAYMENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled'
};

// Product Statuses
const PRODUCT_STATUS = {
    DRAFT: 'Draft',
    ACTIVE: 'Active',
    IN_STOCK: 'In Stock',
    OUT_OF_STOCK: 'Out of Stock',
    DISCONTINUED: 'Discontinued'
};

// Vendor Statuses
const VENDOR_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended'
};

// Notification Types
const NOTIFICATION_TYPES = {
    ORDER: 'order',
    PAYMENT: 'payment',
    PROMOTION: 'promotion',
    SYSTEM: 'system',
    REVIEW: 'review'
};

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

// Cache TTL (in seconds)
const CACHE_TTL = {
    SHORT: 60,          // 1 minute
    MEDIUM: 300,        // 5 minutes
    LONG: 3600,         // 1 hour
    DAY: 86400,         // 24 hours
    WEEK: 604800        // 7 days
};

// Service names for inter-service communication
const SERVICES = {
    AUTH: 'auth-service',
    USER: 'user-service',
    PRODUCT: 'product-service',
    ORDER: 'order-service',
    CART: 'cart-service',
    PAYMENT: 'payment-service',
    VENDOR: 'vendor-service',
    NOTIFICATION: 'notification-service',
    ADMIN: 'admin-service',
    REVIEW: 'review-service',
    SEARCH: 'search-service'
};

// Service URLs (for internal communication)
const SERVICE_URLS = {
    AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    USER: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    PRODUCT: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
    ORDER: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
    CART: process.env.CART_SERVICE_URL || 'http://localhost:3005',
    PAYMENT: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
    VENDOR: process.env.VENDOR_SERVICE_URL || 'http://localhost:3007',
    NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
    ADMIN: process.env.ADMIN_SERVICE_URL || 'http://localhost:3009',
    REVIEW: process.env.REVIEW_SERVICE_URL || 'http://localhost:3010',
    SEARCH: process.env.SEARCH_SERVICE_URL || 'http://localhost:3011'
};

module.exports = {
    USER_ROLES,
    ORDER_STATUS,
    PAYMENT_STATUS,
    PRODUCT_STATUS,
    VENDOR_STATUS,
    NOTIFICATION_TYPES,
    HTTP_STATUS,
    PAGINATION,
    CACHE_TTL,
    SERVICES,
    SERVICE_URLS
};
