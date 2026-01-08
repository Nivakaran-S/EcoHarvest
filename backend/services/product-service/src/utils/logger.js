const winston = require('winston');

function createLogger(serviceName) {
    const isProduction = process.env.NODE_ENV === 'production';

    return winston.createLogger({
        level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
        defaultMeta: { service: serviceName },
        transports: [
            new winston.transports.Console({
                format: isProduction
                    ? winston.format.json()
                    : winston.format.combine(
                        winston.format.colorize(),
                        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                        winston.format.printf(({ level, message, timestamp, service }) =>
                            `${timestamp} [${service}] ${level}: ${message}`
                        )
                    )
            })
        ]
    });
}

module.exports = { createLogger };
