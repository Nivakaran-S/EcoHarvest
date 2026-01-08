/**
 * Database Connection Utilities
 * Provides MongoDB and Redis connection helpers
 */

const mongoose = require('mongoose');
const Redis = require('ioredis');
const { createLogger } = require('./logger');

const logger = createLogger('database');

/**
 * Connect to MongoDB
 * @param {string} uri - MongoDB connection URI
 * @param {Object} options - Additional mongoose options
 * @returns {Promise<mongoose.Connection>}
 */
async function connectDB(uri, options = {}) {
    try {
        const defaultOptions = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        const conn = await mongoose.connect(uri, { ...defaultOptions, ...options });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

        return conn.connection;
    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

/**
 * Connect to Redis
 * @param {Object} config - Redis configuration
 * @returns {Redis}
 */
function connectRedis(config = {}) {
    const defaultConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
    };

    const redis = new Redis({ ...defaultConfig, ...config });

    redis.on('connect', () => {
        logger.info('Redis connected');
    });

    redis.on('error', (err) => {
        logger.error('Redis connection error:', err);
    });

    redis.on('reconnecting', () => {
        logger.warn('Redis reconnecting...');
    });

    return redis;
}

/**
 * Graceful shutdown helper
 * @param {mongoose.Connection} mongoConn 
 * @param {Redis} redisClient 
 */
async function gracefulShutdown(mongoConn, redisClient) {
    logger.info('Initiating graceful shutdown...');

    try {
        if (mongoConn) {
            await mongoose.disconnect();
            logger.info('MongoDB disconnected');
        }

        if (redisClient) {
            await redisClient.quit();
            logger.info('Redis disconnected');
        }
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
    }
}

module.exports = {
    connectDB,
    connectRedis,
    gracefulShutdown,
    mongoose
};
