/**
 * Authentication Controller
 * Handles all auth-related business logic
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const { publishEvent } = require('../utils/messaging');
const { createLogger } = require('../utils/logger');

const logger = createLogger('auth-controller');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generate JWT tokens
 */
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
};

/**
 * Set auth cookies
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
    // Access token cookie
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Refresh token cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Legacy cookie for frontend compatibility
    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

/**
 * Register new user
 */
exports.register = async (req, res) => {
    try {
        const { username, email, password, role = 'Customer' } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide username, email, and password'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // Create verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role,
            verificationToken,
            verificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token
        user.refreshTokens.push({
            token: refreshToken,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await user.save();

        // Set cookies
        setAuthCookies(res, accessToken, refreshToken);

        // Publish user created event
        await publishEvent('user.created', {
            userId: user._id,
            email: user.email,
            role: user.role
        });

        logger.info(`User registered: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                accessToken
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
    }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password'
            });
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            return res.status(423).json({
                success: false,
                error: 'Account temporarily locked. Try again later.'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account has been deactivated'
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            await user.incrementLoginAttempts();
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Reset login attempts
        await user.resetLoginAttempts();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token
        user.refreshTokens.push({
            token: refreshToken,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        // Keep only last 5 refresh tokens
        if (user.refreshTokens.length > 5) {
            user.refreshTokens = user.refreshTokens.slice(-5);
        }

        await user.save();

        // Set cookies
        setAuthCookies(res, accessToken, refreshToken);

        logger.info(`User logged in: ${email}`);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                accessToken
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            // Remove refresh token from database
            await User.updateOne(
                { 'refreshTokens.token': refreshToken },
                { $pull: { refreshTokens: { token: refreshToken } } }
            );
        }

        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('token');

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Find user with this refresh token
        const user = await User.findOne({
            _id: decoded.id,
            'refreshTokens.token': refreshToken
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Update refresh token
        await User.updateOne(
            { _id: user._id, 'refreshTokens.token': refreshToken },
            {
                $set: {
                    'refreshTokens.$.token': tokens.refreshToken,
                    'refreshTokens.$.expires': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            }
        );

        // Set cookies
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        res.json({
            success: true,
            data: {
                accessToken: tokens.accessToken
            }
        });
    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            error: 'Token refresh failed'
        });
    }
};

/**
 * Check cookie / session validation
 * Supports legacy frontend
 */
exports.checkCookie = async (req, res) => {
    try {
        const token = req.cookies.token || req.cookies.accessToken ||
            (req.headers.authorization?.startsWith('Bearer ')
                ? req.headers.authorization.slice(7)
                : null);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive'
            });
        }

        // Return user info in legacy format for frontend compatibility
        res.json({
            id: user._id,
            role: user.role,
            email: user.email,
            username: user.username
        });
    } catch (error) {
        logger.error('Cookie check error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid session'
        });
    }
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user'
        });
    }
};

/**
 * Forgot password
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({
                success: true,
                message: 'If an account exists, a reset email has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

        await user.save();

        // Publish password reset event for notification service
        await publishEvent('email.send', {
            to: user.email,
            template: 'password-reset',
            data: {
                resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
                username: user.username
            }
        });

        logger.info(`Password reset requested for: ${email}`);

        res.json({
            success: true,
            message: 'If an account exists, a reset email has been sent'
        });
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process request'
        });
    }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.refreshTokens = []; // Invalidate all sessions

        await user.save();

        logger.info(`Password reset for: ${user.email}`);

        res.json({
            success: true,
            message: 'Password has been reset'
        });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset password'
        });
    }
};

/**
 * Verify email
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            verificationToken: token,
            verificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token'
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;

        await user.save();

        logger.info(`Email verified for: ${user.email}`);

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed'
        });
    }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        user.refreshTokens = []; // Invalidate all sessions

        await user.save();

        logger.info(`Password changed for: ${user.email}`);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        logger.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
};

/**
 * Enable two-factor authentication
 */
exports.enableTwoFactor = async (req, res) => {
    try {
        // Placeholder for 2FA implementation
        res.json({
            success: true,
            message: '2FA feature coming soon'
        });
    } catch (error) {
        logger.error('Enable 2FA error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to enable 2FA'
        });
    }
};

/**
 * Verify two-factor token
 */
exports.verifyTwoFactor = async (req, res) => {
    res.json({
        success: true,
        message: '2FA feature coming soon'
    });
};

/**
 * Disable two-factor authentication
 */
exports.disableTwoFactor = async (req, res) => {
    res.json({
        success: true,
        message: '2FA feature coming soon'
    });
};
