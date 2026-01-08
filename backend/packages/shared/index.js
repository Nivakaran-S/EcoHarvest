/**
 * EcoHarvest Shared Package
 * Common utilities, middleware, and configurations for all microservices
 */

// Database utilities
const database = require('./database');

// Message queue utilities
const messaging = require('./messaging');

// Middleware
const middleware = require('./middleware');

// Logger
const logger = require('./logger');

// Constants and enums
const constants = require('./constants');

// Response helpers
const responses = require('./responses');

// Validators
const validators = require('./validators');

module.exports = {
  database,
  messaging,
  middleware,
  logger,
  constants,
  responses,
  validators,
  
  // Convenience exports
  connectDB: database.connectDB,
  connectRedis: database.connectRedis,
  rabbitMQ: messaging.rabbitMQ,
  authMiddleware: middleware.authMiddleware,
  errorHandler: middleware.errorHandler,
  createLogger: logger.createLogger
};
