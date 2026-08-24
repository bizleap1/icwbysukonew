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
const { 
  authIpLimiter, 
  authAccountLimiter, 
  otpSendLimiter 
} = require('../middleware/rateLimiter.middleware');

// Public Auth Endpoints protected with independent IP and Account limiters
router.post('/register', authIpLimiter, authAccountLimiter, register);
router.post('/login', authIpLimiter, authAccountLimiter, login);

router.post('/send-otp', authIpLimiter, otpSendLimiter, sendOTP);
router.post('/send-register-otp', authIpLimiter, otpSendLimiter, sendRegisterOTP);

router.post('/verify-register-otp', authIpLimiter, authAccountLimiter, verifyRegisterOTP);
router.post('/verify-otp-login', authIpLimiter, authAccountLimiter, verifyOTPLogin);
router.post('/reset-password-otp', authIpLimiter, authAccountLimiter, resetPasswordWithOTP);

// Protected User Profile
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
