/**
 * Winston Logger Configuration
 * Structured logging for all microservices
 */

const winston = require('winston');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for development
const devFormat = printf(({ level, message, timestamp, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service || 'app'}] ${level}: ${message} ${metaStr}`;
});

// Custom log format for production (JSON)
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

/**
 * Create a logger instance for a service
 * @param {string} serviceName - Name of the service
 * @param {Object} options - Additional options
 * @returns {winston.Logger}
 */
function createLogger(serviceName, options = {}) {
    const isProduction = process.env.NODE_ENV === 'production';
    const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

    const transports = [
        new winston.transports.Console({
            format: isProduction
                ? prodFormat
                : combine(
                    colorize(),
                    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    devFormat
                )
        })
    ];

    // Add file transport in production
    if (isProduction) {
        transports.push(
            new winston.transports.File({
                filename: `logs/${serviceName}-error.log`,
                level: 'error',
                maxsize: 5242880, // 5MB
                maxFiles: 5
            }),
            new winston.transports.File({
                filename: `logs/${serviceName}-combined.log`,
                maxsize: 5242880,
                maxFiles: 5
            })
        );
    }

    return winston.createLogger({
        level: logLevel,
        defaultMeta: { service: serviceName },
        transports,
        ...options
    });
}

/**
 * HTTP Request Logger (Morgan-style)
 */
function httpLogger(serviceName) {
    const logger = createLogger(serviceName);

    return (req, res, next) => {
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;
            const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

            logger[logLevel]({
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
        });

        next();
    };
}

module.exports = {
    createLogger,
    httpLogger,
    winston
};
