const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");


const generateTokens = async (user) => {
    const accessToken = jwt.sign({
        userId: user._id,
        username: user.username,
        email: user.email
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 7);

    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt: expireAt
    })

    return { accessToken, refreshToken }
}

module.exports = generateTokens;