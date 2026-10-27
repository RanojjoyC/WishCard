const express = require('express');
const router = express.Router();
const { findCardHolders } = require('../controllers/holderController');
const { protect } = require('../middlewares/auth');

router.get('/nearby', protect, findCardHolders);

module.exports = router;
