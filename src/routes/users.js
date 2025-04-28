const express = require('express');
const { searchUser } = require('../controllers/userController');

const router = express.Router();

router.post('/search', searchUser);


module.exports = router;