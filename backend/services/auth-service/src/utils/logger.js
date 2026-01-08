/**
 * Winston Logger Configuration
 */

const winston = require('winston');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = printf(({ level, message, timestamp, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service || 'auth'}] ${level}: ${message} ${metaStr}`;
});

function createLogger(serviceName, options = {}) {
    const isProduction = process.env.NODE_ENV === 'production';
    const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

    const transports = [
        new winston.transports.Console({
            format: isProduction
                ? combine(timestamp(), errors({ stack: true }), json())
                : combine(
                    colorize(),
                    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    devFormat
                )
        })
    ];

    return winston.createLogger({
        level: logLevel,
        defaultMeta: { service: serviceName },
        transports,
        ...options
    });
}

module.exports = { createLogger };
