import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  makeAdmin,
  setUserRole,
  sendLoginOtp,
  verifyLoginOtp,
  sendRegisterOtp,
  verifyRegisterOtp,
  heartbeat,
  logout,
  getRealtimeLogins,
} from '../controllers/auth.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// ─── PUBLIC AUTH ROUTES (with rate limiting) ─────────────────────────────────
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/send-login-otp', otpLimiter, sendLoginOtp);
router.post('/verify-login-otp', authLimiter, verifyLoginOtp);
router.post('/send-register-otp', otpLimiter, sendRegisterOtp);
router.post('/verify-register-otp', authLimiter, verifyRegisterOtp);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// ─── AUTHENTICATED USER ROUTES ───────────────────────────────────────────────
router.get('/me', authMiddleware, getMe);
router.get('/profile', authMiddleware, getMe);
router.put('/update-profile', authMiddleware, updateProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/heartbeat', authMiddleware, heartbeat);
router.post('/logout', authMiddleware, logout);

// ─── REAL-TIME ADMIN MONITORING ──────────────────────────────────────────────
router.get('/realtime-logins', authMiddleware, authorizeRoles('admin', 'super_admin', 'store_manager'), getRealtimeLogins);

// ─── ADMIN ROLE MANAGEMENT ───────────────────────────────────────────────────
// make-admin: kept for backward compat, restricted to admin/super_admin
router.post('/make-admin', authMiddleware, authorizeRoles('admin'), makeAdmin);

// set-role: super_admin only — can set any role
router.post('/set-role', authMiddleware, authorizeRoles('super_admin'), setUserRole);

export default router;

