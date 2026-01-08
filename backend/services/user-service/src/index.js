/**
 * User Service - User Profiles & Preferences
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    username: String,
    firstName: String,
    lastName: String,
    phoneNumber: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    avatar: String,
    addresses: [{
        label: { type: String, default: 'Home' },
        fullName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: { type: String, default: 'India' },
        isDefault: { type: Boolean, default: false }
    }],
    preferences: {
        language: { type: String, default: 'en' },
        currency: { type: String, default: 'INR' },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true }
        },
        newsletter: { type: Boolean, default: true }
    },
    role: { type: String, enum: ['Customer', 'Vendor', 'Admin'], default: 'Customer' }
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'user-service' });
});

// Get user profile
app.get('/:userId', async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ userId: req.params.userId });
        if (!profile) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get user' });
    }
});

// Get customer details (legacy endpoint)
app.get('/details/:userId', async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ userId: req.params.userId });
        if (!profile) {
            return res.json({});
        }
        res.json({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phoneNumber: profile.phoneNumber,
            dateOfBirth: profile.dateOfBirth,
            gender: profile.gender,
            address: profile.addresses.find(a => a.isDefault)?.street
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get user details' });
    }
});

// Create/Update user profile
app.put('/:userId', async (req, res) => {
    try {
        const profile = await UserProfile.findOneAndUpdate(
            { userId: req.params.userId },
            { $set: req.body },
            { new: true, upsert: true, runValidators: true }
        );
        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});

// Add address
app.post('/:userId/addresses', async (req, res) => {
    try {
        const { userId } = req.params;
        const address = req.body;

        if (address.isDefault) {
            await UserProfile.updateOne(
                { userId },
                { $set: { 'addresses.$[].isDefault': false } }
            );
        }

        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            { $push: { addresses: address } },
            { new: true, upsert: true }
        );

        res.json({ success: true, data: profile.addresses });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add address' });
    }
});

// Update address
app.put('/:userId/addresses/:addressId', async (req, res) => {
    try {
        const { userId, addressId } = req.params;
        const updates = req.body;

        if (updates.isDefault) {
            await UserProfile.updateOne(
                { userId },
                { $set: { 'addresses.$[].isDefault': false } }
            );
        }

        const profile = await UserProfile.findOneAndUpdate(
            { userId, 'addresses._id': addressId },
            { $set: { 'addresses.$': { ...updates, _id: addressId } } },
            { new: true }
        );

        res.json({ success: true, data: profile?.addresses });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update address' });
    }
});

// Delete address
app.delete('/:userId/addresses/:addressId', async (req, res) => {
    try {
        await UserProfile.findOneAndUpdate(
            { userId: req.params.userId },
            { $pull: { addresses: { _id: req.params.addressId } } }
        );
        res.json({ success: true, message: 'Address deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete address' });
    }
});

// Get preferences
app.get('/:userId/preferences', async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ userId: req.params.userId });
        res.json({ success: true, data: profile?.preferences || {} });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get preferences' });
    }
});

// Update preferences
app.put('/:userId/preferences', async (req, res) => {
    try {
        const profile = await UserProfile.findOneAndUpdate(
            { userId: req.params.userId },
            { $set: { preferences: req.body } },
            { new: true }
        );
        res.json({ success: true, data: profile?.preferences });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update preferences' });
    }
});

// Start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoharvest_users')
    .then(() => {
        console.log('👤 User Service connected to MongoDB');
        app.listen(PORT, () => console.log(`👤 User Service running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to start User Service:', err);
        process.exit(1);
    });

module.exports = app;
