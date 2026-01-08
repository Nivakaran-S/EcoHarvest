/**
 * Order Model
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productImage: String,
    vendorId: { type: String, required: true },
    vendorName: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true }
});

const addressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    postalCode: String,
    country: { type: String, default: 'India' }
});

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, unique: true },
    customerId: { type: String, required: true, index: true },
    customerEmail: String,
    customerName: String,

    items: [orderItemSchema],

    shippingAddress: addressSchema,
    billingAddress: addressSchema,

    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    status: {
        type: String,
        enum: ['Pending', 'Pending Payment', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'],
        default: 'Pending',
        index: true
    },

    paymentMethod: {
        type: String,
        enum: ['cod', 'card', 'upi', 'netbanking', 'wallet'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: String,

    orderTime: { type: Date, default: Date.now },
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,

    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,

    notes: String,
    cancellationReason: String,

    metadata: { type: Map, of: String }
}, {
    timestamps: true
});

// Indexes
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ 'items.vendorId': 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

// Generate order number before saving
orderSchema.pre('save', function (next) {
    if (!this.orderNumber) {
        this.orderNumber = `ECO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
