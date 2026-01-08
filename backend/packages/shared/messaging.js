/**
 * RabbitMQ Message Queue Utilities
 * Event-driven communication between microservices
 */

const amqp = require('amqplib');
const { createLogger } = require('./logger');

const logger = createLogger('messaging');

class RabbitMQ {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.connected = false;
    }

    /**
     * Connect to RabbitMQ
     * @param {string} url - RabbitMQ connection URL
     */
    async connect(url = process.env.RABBITMQ_URL || 'amqp://localhost:5672') {
        try {
            this.connection = await amqp.connect(url);
            this.channel = await this.connection.createChannel();
            this.connected = true;

            logger.info('RabbitMQ connected');

            this.connection.on('error', (err) => {
                logger.error('RabbitMQ connection error:', err);
                this.connected = false;
            });

            this.connection.on('close', () => {
                logger.warn('RabbitMQ connection closed');
                this.connected = false;
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connect(url), 5000);
            });

            return this.channel;
        } catch (error) {
            logger.error('Failed to connect to RabbitMQ:', error);
            // Retry connection after 5 seconds
            setTimeout(() => this.connect(url), 5000);
        }
    }

    /**
     * Publish a message to an exchange
     * @param {string} exchange - Exchange name
     * @param {string} routingKey - Routing key
     * @param {Object} message - Message payload
     */
    async publish(exchange, routingKey, message) {
        try {
            if (!this.connected) {
                throw new Error('RabbitMQ not connected');
            }

            await this.channel.assertExchange(exchange, 'topic', { durable: true });

            const messageBuffer = Buffer.from(JSON.stringify({
                ...message,
                timestamp: new Date().toISOString(),
                correlationId: require('uuid').v4()
            }));

            this.channel.publish(exchange, routingKey, messageBuffer, {
                persistent: true,
                contentType: 'application/json'
            });

            logger.debug(`Published message to ${exchange}/${routingKey}`);
        } catch (error) {
            logger.error('Failed to publish message:', error);
            throw error;
        }
    }

    /**
     * Subscribe to messages from a queue
     * @param {string} queue - Queue name
     * @param {string} exchange - Exchange name
     * @param {string} routingKey - Routing key pattern
     * @param {Function} handler - Message handler function
     */
    async subscribe(queue, exchange, routingKey, handler) {
        try {
            if (!this.connected) {
                throw new Error('RabbitMQ not connected');
            }

            await this.channel.assertExchange(exchange, 'topic', { durable: true });
            await this.channel.assertQueue(queue, { durable: true });
            await this.channel.bindQueue(queue, exchange, routingKey);

            await this.channel.consume(queue, async (msg) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        logger.debug(`Received message from ${queue}:`, content);

                        await handler(content, msg);
                        this.channel.ack(msg);
                    } catch (error) {
                        logger.error('Error processing message:', error);
                        // Reject and requeue if processing fails
                        this.channel.nack(msg, false, true);
                    }
                }
            });

            logger.info(`Subscribed to queue: ${queue} with routing key: ${routingKey}`);
        } catch (error) {
            logger.error('Failed to subscribe:', error);
            throw error;
        }
    }

    /**
     * Send a direct message to a queue
     * @param {string} queue - Queue name
     * @param {Object} message - Message payload
     */
    async sendToQueue(queue, message) {
        try {
            if (!this.connected) {
                throw new Error('RabbitMQ not connected');
            }

            await this.channel.assertQueue(queue, { durable: true });

            const messageBuffer = Buffer.from(JSON.stringify({
                ...message,
                timestamp: new Date().toISOString()
            }));

            this.channel.sendToQueue(queue, messageBuffer, { persistent: true });
            logger.debug(`Sent message to queue: ${queue}`);
        } catch (error) {
            logger.error('Failed to send to queue:', error);
            throw error;
        }
    }

    /**
     * Close the connection
     */
    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.connected = false;
            logger.info('RabbitMQ connection closed');
        } catch (error) {
            logger.error('Error closing RabbitMQ connection:', error);
        }
    }
}

// Singleton instance
const rabbitMQ = new RabbitMQ();

// Event types
const EVENTS = {
    // User events
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',

    // Product events
    PRODUCT_CREATED: 'product.created',
    PRODUCT_UPDATED: 'product.updated',
    PRODUCT_DELETED: 'product.deleted',
    INVENTORY_LOW: 'inventory.low',
    INVENTORY_UPDATED: 'inventory.updated',

    // Order events
    ORDER_CREATED: 'order.created',
    ORDER_UPDATED: 'order.updated',
    ORDER_CANCELLED: 'order.cancelled',
    ORDER_SHIPPED: 'order.shipped',
    ORDER_DELIVERED: 'order.delivered',

    // Payment events
    PAYMENT_INITIATED: 'payment.initiated',
    PAYMENT_COMPLETED: 'payment.completed',
    PAYMENT_FAILED: 'payment.failed',
    PAYMENT_REFUNDED: 'payment.refunded',

    // Notification events
    NOTIFICATION_SEND: 'notification.send',
    EMAIL_SEND: 'email.send',
    SMS_SEND: 'sms.send',

    // Review events
    REVIEW_CREATED: 'review.created',
    REVIEW_UPDATED: 'review.updated',

    // Vendor events
    VENDOR_REGISTERED: 'vendor.registered',
    VENDOR_APPROVED: 'vendor.approved',
    VENDOR_REJECTED: 'vendor.rejected'
};

// Exchange names
const EXCHANGES = {
    USERS: 'ecoharvest.users',
    PRODUCTS: 'ecoharvest.products',
    ORDERS: 'ecoharvest.orders',
    PAYMENTS: 'ecoharvest.payments',
    NOTIFICATIONS: 'ecoharvest.notifications',
    REVIEWS: 'ecoharvest.reviews',
    VENDORS: 'ecoharvest.vendors'
};

module.exports = {
    rabbitMQ,
    RabbitMQ,
    EVENTS,
    EXCHANGES
};
