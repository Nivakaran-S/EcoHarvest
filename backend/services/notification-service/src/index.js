/**
 * Notification Service - Email, SMS, Push & Real-time Notifications
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3008;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Notification Schema
const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order', 'payment', 'promotion', 'system', 'review'], default: 'system' },
    isRead: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

// Socket.IO connections
const userSockets = new Map();

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('register', (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
        for (const [userId, socketId] of userSockets) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
    });
});

// Send real-time notification to user
const sendRealtime = (userId, notification) => {
    const socketId = userSockets.get(userId);
    if (socketId) {
        io.to(socketId).emit('notification', notification);
    }
};

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'notification-service' });
});

// Get notifications for user
app.get('/:userId', async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const query = { userId: req.params.userId };
        if (unreadOnly === 'true') query.isRead = false;

        const notifications = await Notification.find(query)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get notifications' });
    }
});

// Mark notification as read
app.put('/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to mark as read' });
    }
});

// Mark all as read
app.put('/:userId/read-all', async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.params.userId }, { isRead: true });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to mark all as read' });
    }
});

// Delete notification
app.delete('/:id', async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete notification' });
    }
});

// Create notification (internal API)
app.post('/send', async (req, res) => {
    try {
        const { userId, title, message, type, data } = req.body;

        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            data
        });

        // Send real-time notification
        sendRealtime(userId, notification);

        res.status(201).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to send notification' });
    }
});

// Broadcast notification (admin)
app.post('/broadcast', async (req, res) => {
    try {
        const { userIds, title, message, type } = req.body;

        const notifications = await Notification.insertMany(
            userIds.map(userId => ({ userId, title, message, type }))
        );

        // Send real-time to all
        userIds.forEach(userId => {
            sendRealtime(userId, { title, message, type });
        });

        res.status(201).json({ success: true, count: notifications.length });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to broadcast' });
    }
});

// Get preferences
app.get('/:userId/preferences', async (req, res) => {
    res.json({
        success: true,
        data: {
            email: true,
            sms: false,
            push: true,
            orderUpdates: true,
            promotions: true
        }
    });
});

// Start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoharvest_notifications')
    .then(() => {
        console.log('🔔 Notification Service connected to MongoDB');
        server.listen(PORT, () => console.log(`🔔 Notification Service running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to start Notification Service:', err);
        process.exit(1);
    });

module.exports = { app, io };
