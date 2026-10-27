const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  addCreditCard, 
  updateCreditCard, 
  deleteCreditCard, 
  updateProfile, 
  updateLocation, 
  updateUpi 
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/card', protect, addCreditCard);
router.put('/card/:cardId', protect, updateCreditCard);
router.delete('/card/:cardId', protect, deleteCreditCard);
router.put('/location', protect, updateLocation);
router.put('/upi', protect, updateUpi);

module.exports = router;
