const logger = require('../utils/logger');
const { validateRegistration, validatelogin } = require('../utils/validation');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const generateTokens = require('../utils/generateToken');


// user register
const registerUser = async (req, res) => {
    logger.info("Register endpoint hit...");

    try {
        const { error } = validateRegistration(req.body);

        if (error) {
            logger.error(`Validation error: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { username, email, password } = req.body;

        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
            logger.warn('User already exists');

            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        user = new User({ username, email, password });
        await user.save();

        logger.warn("User saved successfully", user._id);

        let { accessToken, refreshToken } = await generateTokens(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                accessToken,
                refreshToken,
                userId: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (e) {
        logger.error(`Registration error occured`, e)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

// user login
const loginUser = async (req, res) => {
    logger.info("Login endpoint hit...");
    try {
        const { error } = validatelogin(req.body);
        if (error) {
            logger.warn(`Validation error: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn('Invalid user');
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isValidPassoword = await user.ComparePassword(password);
        if (!isValidPassoword) {
            logger.warn('Invalid password');
            return res.status(400).json({
                success: false,
                message: 'Invalid password'
            });
        }

        const { accessToken, refreshToken } = await generateTokens(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                userId: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (e) {
        logger.error(`Login error occured`, e);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

// refresh token 
const refreshTokenUser = async (req, res) => {
    logger.info("Refresh token endpoint hit...");
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            logger.warn('Refresh token is required');
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            logger.warn('Invalid or expire refresh token');
            return res.status(401).json({
                success: false,
                message: 'Invalid or expire refresh token'
            });
        }

        const user = await User.findById(storedToken.user);
        if (!user) {
            logger.warn('User not found');
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokens(user);

        // delete the old refresh token
        await RefreshToken.deleteOne({ token: refreshToken });

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (e) {
        logger.error(`Refresh token error occured`, e);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

// logout 
const logoutUser = async (req, res) => {
    logger.info("Logout endpoint hit...");
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            logger.warn('Refresh token is missing');
            return res.status(400).json({
                success: false,
                message: 'Refresh token is missing'
            });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });
        if (!storedToken) {
            logger.warn('Invalid refresh token');
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        await RefreshToken.deleteOne({ token: refreshToken });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (e) {
        logger.error(`Logout error occured`, e);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

const getMe = async (req, res) => {
    try {
        // req.user is set by verifyToken middleware
        res.status(200).json({
            success: true,
            data: {
                id: req.user.userId,
                name: req.user.username,
                email: req.user.email,
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    refreshTokenUser,
    logoutUser,
    getMe
};