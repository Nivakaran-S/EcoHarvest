/**
 * Payment Service - Mock Payment Gateway
 * Simulates payment processing for portfolio demonstration
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Payment Schema
const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, unique: true, default: () => `pay_${uuidv4().replace(/-/g, '')}` },
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    method: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet', 'cod'],
        required: true
    },
    status: {
        type: String,
        enum: ['initiated', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'initiated'
    },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    cardLast4: String,
    upiId: String,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    metadata: { type: Map, of: String }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'payment-service', gateway: 'mock' });
});

// Initiate payment
app.post('/initiate', async (req, res) => {
    try {
        const { orderId, userId, amount, method, cardDetails, upiId } = req.body;

        const payment = await Payment.create({
            orderId,
            userId: userId || req.headers['x-user-id'],
            amount,
            method,
            status: 'initiated',
            cardLast4: cardDetails?.number?.slice(-4),
            upiId
        });

        // Simulate payment gateway response
        const mockGatewayResponse = {
            gatewayPaymentId: `mock_${uuidv4()}`,
            redirectUrl: `http://localhost:3000/payment-success?paymentId=${payment.paymentId}`,
            qrCode: method === 'upi' ? 'upi://pay?pa=ecoharvest@upi&pn=EcoHarvest' : null
        };

        console.log(`Payment initiated: ${payment.paymentId} for order ${orderId}`);

        res.status(201).json({
            success: true,
            data: {
                paymentId: payment.paymentId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                ...mockGatewayResponse
            }
        });
    } catch (error) {
        console.error('Initiate payment error:', error);
        res.status(500).json({ success: false, error: 'Failed to initiate payment' });
    }
});

// Confirm/Complete payment (Mock - always succeeds for demo)
app.post('/confirm', async (req, res) => {
    try {
        const { paymentId, gatewayResponse } = req.body;

        const payment = await Payment.findOne({ paymentId });
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock success (90% success rate for realism)
        const isSuccess = Math.random() > 0.1;

        payment.status = isSuccess ? 'completed' : 'failed';
        payment.gatewayResponse = {
            ...gatewayResponse,
            mockStatus: isSuccess ? 'SUCCESS' : 'FAILED',
            transactionId: `txn_${uuidv4()}`,
            processedAt: new Date()
        };

        await payment.save();

        console.log(`Payment ${isSuccess ? 'completed' : 'failed'}: ${paymentId}`);

        res.json({
            success: isSuccess,
            data: {
                paymentId: payment.paymentId,
                orderId: payment.orderId,
                status: payment.status,
                amount: payment.amount,
                transactionId: payment.gatewayResponse.transactionId
            },
            message: isSuccess ? 'Payment successful' : 'Payment failed'
        });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ success: false, error: 'Failed to confirm payment' });
    }
});

// Get payment by ID
app.get('/:paymentId', async (req, res) => {
    try {
        const payment = await Payment.findOne({ paymentId: req.params.paymentId });
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }
        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get payment' });
    }
});

// Get payments by user
app.get('/user/:userId', async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.params.userId })
            .sort('-createdAt')
            .lean();
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get payments' });
    }
});

// Refund payment
app.post('/:paymentId/refund', async (req, res) => {
    try {
        const { reason, amount } = req.body;
        const { paymentId } = req.params;

        const payment = await Payment.findOne({ paymentId });
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({ success: false, error: 'Only completed payments can be refunded' });
        }

        const refundAmount = amount || payment.amount;

        payment.status = 'refunded';
        payment.refundAmount = refundAmount;
        payment.refundReason = reason;
        payment.refundedAt = new Date();
        await payment.save();

        console.log(`Payment refunded: ${paymentId}, amount: ${refundAmount}`);

        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: {
                paymentId: payment.paymentId,
                refundAmount,
                status: payment.status
            }
        });
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ success: false, error: 'Failed to process refund' });
    }
});

// Webhook endpoint (mock)
app.post('/webhook/mock', async (req, res) => {
    console.log('Mock webhook received:', req.body);
    res.json({ success: true, received: true });
});

// Start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoharvest_payments')
    .then(() => {
        console.log('💳 Payment Service connected to MongoDB');
        app.listen(PORT, () => console.log(`💳 Payment Service running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to start Payment Service:', err);
        process.exit(1);
    });

module.exports = app;
