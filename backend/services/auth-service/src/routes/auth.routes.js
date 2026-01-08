/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Check cookie (session validation) - supports legacy frontend
router.get('/check-cookie', authController.checkCookie);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/change-password', authMiddleware, authController.changePassword);
router.post('/2fa/enable', authMiddleware, authController.enableTwoFactor);
router.post('/2fa/verify', authMiddleware, authController.verifyTwoFactor);
router.post('/2fa/disable', authMiddleware, authController.disableTwoFactor);

module.exports = router;
