const express = require('express');
const { registerUser, loginUser, refreshTokenUser, logoutUser, getMe } = require('../controllers/authController');
const { validateToken } = require('../middleware/authMiddleware');


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshTokenUser);
router.post('/logout', validateToken, logoutUser);

// Protected routes
router.get('/me', validateToken, getMe);


module.exports = router;

