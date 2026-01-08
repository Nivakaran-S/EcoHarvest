/**
 * Response Helpers
 * Standardized API response format
 */

const { HTTP_STATUS } = require('./constants');

/**
 * Success response
 */
function success(res, data, message = 'Success', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
}

/**
 * Created response
 */
function created(res, data, message = 'Created successfully') {
    return success(res, data, message, HTTP_STATUS.CREATED);
}

/**
 * No content response
 */
function noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
}

/**
 * Error response
 */
function error(res, message, statusCode = HTTP_STATUS.BAD_REQUEST, details = null) {
    const response = {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    };

    if (details) {
        response.details = details;
    }

    return res.status(statusCode).json(response);
}

/**
 * Not found response
 */
function notFound(res, resource = 'Resource') {
    return error(res, `${resource} not found`, HTTP_STATUS.NOT_FOUND);
}

/**
 * Unauthorized response
 */
function unauthorized(res, message = 'Unauthorized') {
    return error(res, message, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Forbidden response
 */
function forbidden(res, message = 'Access denied') {
    return error(res, message, HTTP_STATUS.FORBIDDEN);
}

/**
 * Validation error response
 */
function validationError(res, errors) {
    return error(res, 'Validation failed', HTTP_STATUS.UNPROCESSABLE, errors);
}

/**
 * Internal server error response
 */
function serverError(res, message = 'Internal server error') {
    return error(res, message, HTTP_STATUS.INTERNAL_ERROR);
}

/**
 * Paginated response
 */
function paginated(res, data, pagination, message = 'Success') {
    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: Math.ceil(pagination.total / pagination.limit),
            hasMore: pagination.page * pagination.limit < pagination.total
        },
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    success,
    created,
    noContent,
    error,
    notFound,
    unauthorized,
    forbidden,
    validationError,
    serverError,
    paginated
};
