/**
 * RabbitMQ Messaging Utilities
 */

const amqp = require('amqplib');
const { createLogger } = require('./logger');

const logger = createLogger('messaging');

let channel = null;
let connection = null;

const EXCHANGE = 'ecoharvest.events';

/**
 * Connect to RabbitMQ
 */
async function connectToRabbitMQ() {
    try {
        const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        connection = await amqp.connect(url);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

        logger.info('Connected to RabbitMQ');

        connection.on('error', (err) => {
            logger.error('RabbitMQ connection error:', err);
        });

        connection.on('close', () => {
            logger.warn('RabbitMQ connection closed, reconnecting...');
            setTimeout(connectToRabbitMQ, 5000);
        });

        return channel;
    } catch (error) {
        logger.error('Failed to connect to RabbitMQ:', error);
        setTimeout(connectToRabbitMQ, 5000);
    }
}

/**
 * Publish an event
 */
async function publishEvent(routingKey, data) {
    try {
        if (!channel) {
            logger.warn('RabbitMQ channel not available, skipping event publish');
            return;
        }

        const message = Buffer.from(JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            source: 'auth-service'
        }));

        channel.publish(EXCHANGE, routingKey, message, {
            persistent: true,
            contentType: 'application/json'
        });

        logger.debug(`Published event: ${routingKey}`);
    } catch (error) {
        logger.error('Failed to publish event:', error);
    }
}

/**
 * Subscribe to events
 */
async function subscribeToEvent(queue, routingKey, handler) {
    try {
        if (!channel) {
            throw new Error('RabbitMQ channel not available');
        }

        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, EXCHANGE, routingKey);

        await channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    await handler(content);
                    channel.ack(msg);
                } catch (error) {
                    logger.error('Error processing message:', error);
                    channel.nack(msg, false, true);
                }
            }
        });

        logger.info(`Subscribed to queue: ${queue}`);
    } catch (error) {
        logger.error('Failed to subscribe:', error);
    }
}

/**
 * Close connection
 */
async function closeConnection() {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
    } catch (error) {
        logger.error('Error closing RabbitMQ connection:', error);
    }
}

module.exports = {
    connectToRabbitMQ,
    publishEvent,
    subscribeToEvent,
    closeConnection
};
