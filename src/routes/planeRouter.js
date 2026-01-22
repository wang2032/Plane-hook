const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// 消息钩子路由
router.post('/message-hook', messageController.receiveMessage);

module.exports = router;
