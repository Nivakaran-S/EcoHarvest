/**
 * Common Validators
 * Input validation utilities
 */

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
function isValidPhone(phone) {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
}

/**
 * Validate MongoDB ObjectId
 */
function isValidObjectId(id) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
}

/**
 * Validate password strength
 * At least 8 characters, one uppercase, one lowercase, one number
 */
function isStrongPassword(password) {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
}

/**
 * Sanitize string input
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
}

/**
 * Validate pagination params
 */
function validatePagination(page, limit) {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    return { page: validPage, limit: validLimit };
}

/**
 * Validate date string
 */
function isValidDate(dateStr) {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
}

/**
 * Validate price (positive number with max 2 decimal places)
 */
function isValidPrice(price) {
    if (typeof price !== 'number' || price < 0) return false;
    return /^\d+(\.\d{1,2})?$/.test(price.toString());
}

/**
 * Express validation middleware factory
 */
function validate(schema) {
    return (req, res, next) => {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = req.body[field] || req.query[field] || req.params[field];

            if (rules.required && (value === undefined || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }

            if (value !== undefined && rules.type) {
                if (rules.type === 'email' && !isValidEmail(value)) {
                    errors.push(`${field} must be a valid email`);
                }
                if (rules.type === 'phone' && !isValidPhone(value)) {
                    errors.push(`${field} must be a valid phone number`);
                }
                if (rules.type === 'objectId' && !isValidObjectId(value)) {
                    errors.push(`${field} must be a valid ID`);
                }
            }

            if (value !== undefined && rules.minLength && value.length < rules.minLength) {
                errors.push(`${field} must be at least ${rules.minLength} characters`);
            }

            if (value !== undefined && rules.maxLength && value.length > rules.maxLength) {
                errors.push(`${field} must be at most ${rules.maxLength} characters`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        next();
    };
}

module.exports = {
    isValidEmail,
    isValidPhone,
    isValidObjectId,
    isStrongPassword,
    sanitizeString,
    validatePagination,
    isValidDate,
    isValidPrice,
    validate
};
