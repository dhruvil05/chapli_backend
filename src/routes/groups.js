const express = require('express');
const { createGroup, deleteGroup, getGroups, joinGroup, leaveGroup, getGroupMembers } = require('../controllers/groupController');

const router = express.Router();


router.post('/add-group', createGroup);
router.post('/delete-group', deleteGroup);
router.get('/get-groups', getGroups);
router.post('/join-group', joinGroup);
router.post('/leave-group', leaveGroup);
router.get('/members/:conversationId', getGroupMembers);

module.exports = router;