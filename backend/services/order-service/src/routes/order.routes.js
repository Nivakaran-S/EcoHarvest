/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const Order = require('../models/order.model');

// Get all orders (admin) or user's orders
router.get('/', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];
        const { page = 1, limit = 20, status } = req.query;

        const query = {};
        if (userRole !== 'Admin') {
            query.customerId = userId;
        }
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)).lean(),
            Order.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: orders,
            pagination: { page: parseInt(page), limit: parseInt(limit), total }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
});

// Get orders by user
router.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.params.userId })
            .sort('-createdAt')
            .lean();
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// Get orders by vendor
router.get('/vendor/:vendorId', async (req, res) => {
    try {
        const orders = await Order.find({ 'items.vendorId': req.params.vendorId })
            .sort('-createdAt')
            .lean();
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get vendor orders error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// Create order
router.post('/', async (req, res) => {
    try {
        const {
            customerId,
            customerEmail,
            customerName,
            items,
            shippingAddress,
            billingAddress,
            paymentMethod = 'cod',
            notes
        } = req.body;

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const shippingCost = subtotal > 500 ? 0 : 50; // Free shipping above 500
        const tax = Math.round(subtotal * 0.18); // 18% GST
        const totalAmount = subtotal + shippingCost + tax;

        const order = await Order.create({
            customerId: customerId || req.headers['x-user-id'],
            customerEmail,
            customerName,
            items,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            subtotal,
            shippingCost,
            tax,
            totalAmount,
            paymentMethod,
            notes,
            status: paymentMethod === 'cod' ? 'Confirmed' : 'Pending Payment'
        });

        console.log(`Order created: ${order.orderNumber}`);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

// Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { status, trackingNumber, carrier } = req.body;

        const updateData = { status };

        // Set timestamps based on status
        if (status === 'Confirmed') updateData.confirmedAt = new Date();
        if (status === 'Shipped') {
            updateData.shippedAt = new Date();
            if (trackingNumber) updateData.trackingNumber = trackingNumber;
            if (carrier) updateData.carrier = carrier;
        }
        if (status === 'Delivered') updateData.deliveredAt = new Date();
        if (status === 'Cancelled') updateData.cancelledAt = new Date();

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        res.json({
            success: true,
            message: 'Order status updated',
            data: order
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, error: 'Failed to update order' });
    }
});

// Cancel order
router.post('/:id/cancel', async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Check if order can be cancelled
        if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                error: 'Order cannot be cancelled at this stage'
            });
        }

        order.status = 'Cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason;
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ success: false, error: 'Failed to cancel order' });
    }
});

// Get order tracking
router.get('/:id/tracking', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .select('orderNumber status trackingNumber carrier shippedAt estimatedDelivery')
            .lean();

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Get tracking error:', error);
        res.status(500).json({ success: false, error: 'Failed to get tracking info' });
    }
});

module.exports = router;
