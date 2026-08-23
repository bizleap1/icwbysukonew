const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  sendOTP, 
  sendRegisterOTP, 
  verifyRegisterOTP, 
  verifyOTPLogin, 
  resetPasswordWithOTP,
  getProfile,
  updateProfile
} = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/send-register-otp', sendRegisterOTP);
router.post('/verify-register-otp', verifyRegisterOTP);
router.post('/verify-otp-login', verifyOTPLogin);
router.post('/reset-password-otp', resetPasswordWithOTP);

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
