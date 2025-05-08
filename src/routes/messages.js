const express = require('express');
const { getAllMessages, storeMessage, getMessages, getChatList } = require('../controllers/chatController');
const { validateToken } = require('../middleware/authMiddleware');

const router = express.Router();


router.get('/addMessage', storeMessage);
router.get('/getAllMessage', getAllMessages);
router.post('/messages', getMessages);
router.get('/chat-list', validateToken, getChatList);

module.exports = router;