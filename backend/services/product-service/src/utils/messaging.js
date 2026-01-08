const amqp = require('amqplib');
const { createLogger } = require('./logger');

const logger = createLogger('messaging');

let channel = null;
let connection = null;
const EXCHANGE = 'ecoharvest.events';

async function connectToRabbitMQ() {
    try {
        const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        connection = await amqp.connect(url);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
        logger.info('Connected to RabbitMQ');

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

async function publishEvent(routingKey, data) {
    try {
        if (!channel) return;
        const message = Buffer.from(JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            source: 'product-service'
        }));
        channel.publish(EXCHANGE, routingKey, message, {
            persistent: true,
            contentType: 'application/json'
        });
    } catch (error) {
        logger.error('Failed to publish event:', error);
    }
}

async function subscribeToEvents() {
    try {
        if (!channel) return;

        // Subscribe to order events to update sold count
        const queue = 'product-service-orders';
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, EXCHANGE, 'order.created');

        await channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    logger.info('Received order event:', content);
                    // Update sold count for products in order
                    channel.ack(msg);
                } catch (error) {
                    logger.error('Error processing message:', error);
                    channel.nack(msg, false, true);
                }
            }
        });
    } catch (error) {
        logger.error('Failed to subscribe to events:', error);
    }
}

module.exports = { connectToRabbitMQ, publishEvent, subscribeToEvents };
