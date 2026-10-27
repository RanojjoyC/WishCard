const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');

router.get('/:requestId', protect, getMessages);
router.post('/:requestId', protect, sendMessage);

module.exports = router;
