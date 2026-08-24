const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prisma/client');
const { 
  validateEmail, 
  validatePassword, 
  validateOtpFormat, 
  rejectForbiddenFields 
} = require('../utils/validator');
const { 
  issueOtp, 
  invalidateOtp, 
  verifyAndConsumeOtp, 
  hashOtp 
} = require('../utils/otp.service');
const { sendOTPEmail } = require('../utils/email.service');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generates an HS256 JWT containing verified userId and active token_version
 */
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      role: user.role, 
      token_version: user.token_version || 1,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { 
      algorithm: 'HS256',
      expiresIn: JWT_EXPIRES_IN 
    }
  );
}

/**
 * Standard Email & Password Registration
 */
async function register(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { name, phone, email, password } = req.body;

    const cleanEmail = validateEmail(email);
    validatePassword(password);

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account already exists with this email' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: cleanEmail,
        password_hash,
        token_version: 1
      }
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Register error:", err.message);
    res.status(500).json({ error: 'Something went wrong during registration.' });
  }
}

/**
 * Password Login (Enumeration Safe)
 */
async function login(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      // Dummy comparison to prevent timing side-channel enumeration
      await bcrypt.compare(password, '$2a$10$dummyhashfortimingpreventionxxxxxxxxxxxxxxxxxxxxxxxx');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please check your connection.' });
  }
}

/**
 * Send OTP for Login / Password Reset (Enumeration-Safe)
 */
async function sendOTP(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { email, purpose } = req.body;
    const cleanEmail = validateEmail(email);
    const otpPurpose = purpose === 'password_reset' ? 'password_reset' : 'login';

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // If user does not exist, perform dummy HMAC timing calculation and return identical neutral message
    if (!user) {
      try {
        hashOtp(cleanEmail, '999999', otpPurpose);
        await new Promise(r => setTimeout(r, 60)); // Simulates DB / crypto duration
      } catch (e) {}
      return res.json({
        message: 'If an account is associated with this email, a security verification code has been dispatched.'
      });
    }

    // User exists: Issue OTP transactionally
    const { otpCode, otpRecord } = await issueOtp(cleanEmail, otpPurpose);

    try {
      await sendOTPEmail(cleanEmail, otpCode, otpPurpose === 'password_reset' ? 'Password Reset Verification' : 'Login Verification');
    } catch (mailErr) {
      // Invalidate unusable OTP so user is not trapped behind 60s cooldown
      await invalidateOtp(otpRecord.id);
      console.error("Email delivery failed for OTP:", mailErr.message);
      return res.status(500).json({ error: 'Failed to deliver security verification email. Please try again.' });
    }

    res.json({
      message: 'If an account is associated with this email, a security verification code has been dispatched.'
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Send OTP error:', err.message);
    res.status(500).json({ error: 'Failed to dispatch verification code. Please try again.' });
  }
}

/**
 * Send OTP for Registration Verification
 */
async function sendRegisterOTP(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { name, phone, email, password } = req.body;

    const cleanEmail = validateEmail(email);
    validatePassword(password);

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account already exists with this email' });
    }

    // Pre-hash password before saving to metadata (NEVER store plaintext passwords in metadata)
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const { otpCode, otpRecord } = await issueOtp(cleanEmail, 'register', {
      name: name.trim(),
      phone: phone.trim(),
      password_hash
    });

    try {
      await sendOTPEmail(cleanEmail, otpCode, 'Account Registration Verification');
    } catch (mailErr) {
      await invalidateOtp(otpRecord.id);
      console.error("Email delivery failed for register OTP:", mailErr.message);
      return res.status(500).json({ error: 'Failed to deliver registration verification email. Please try again.' });
    }

    res.json({
      message: `Registration verification code sent to ${cleanEmail}`
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Send Register OTP error:', err.message);
    res.status(500).json({ error: 'Failed to dispatch registration verification code.' });
  }
}

/**
 * Verify Register OTP & Create Account
 */
async function verifyRegisterOTP(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { email, otp } = req.body;

    const cleanEmail = validateEmail(email);
    const cleanOtp = validateOtpFormat(otp);

    const result = await verifyAndConsumeOtp(cleanEmail, cleanOtp, 'register');
    if (!result.valid) {
      return res.status(400).json({ error: result.error || 'Invalid or expired verification code.' });
    }

    const metadata = result.otpRecord.metadata || {};
    if (!metadata.password_hash || !metadata.name) {
      return res.status(400).json({ error: 'Registration session expired. Please register again.' });
    }

    const user = await prisma.user.create({
      data: {
        name: metadata.name,
        phone: metadata.phone || '',
        email: cleanEmail,
        password_hash: metadata.password_hash,
        token_version: 1
      }
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Verify register OTP error:', err.message);
    res.status(500).json({ error: 'Failed to complete registration.' });
  }
}

/**
 * Verify OTP Login
 */
async function verifyOTPLogin(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { email, otp } = req.body;

    const cleanEmail = validateEmail(email);
    const cleanOtp = validateOtpFormat(otp);

    const result = await verifyAndConsumeOtp(cleanEmail, cleanOtp, 'login');
    if (!result.valid) {
      return res.status(400).json({ error: result.error || 'Invalid or expired verification code.' });
    }

    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      // Auto-create passwordless client user with secure random hash
      const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), BCRYPT_ROUNDS);
      user = await prisma.user.create({
        data: {
          name: cleanEmail.split('@')[0],
          phone: '',
          email: cleanEmail,
          password_hash: randomPasswordHash,
          token_version: 1
        }
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Verify OTP login error:', err.message);
    res.status(500).json({ error: 'Failed to verify login code.' });
  }
}

/**
 * Reset Password with OTP (Atomic Session Invalidation)
 */
async function resetPasswordWithOTP(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { email, otp, newPassword } = req.body;

    const cleanEmail = validateEmail(email);
    const cleanOtp = validateOtpFormat(otp);
    validatePassword(newPassword);

    const result = await verifyAndConsumeOtp(cleanEmail, cleanOtp, 'password_reset');
    if (!result.valid) {
      return res.status(400).json({ error: result.error || 'Invalid or expired verification code.' });
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid verification session.' });
    }

    // Hash new password & atomically increment token_version to invalidate all prior sessions
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: newPasswordHash,
        token_version: { increment: 1 }
      }
    });

    const token = generateToken(updatedUser);

    res.json({
      message: 'Password reset successful! All prior sessions have been invalidated.',
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Reset password OTP error:', err.message);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
}

/**
 * Get User Profile & Addresses
 */
async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        created_at: true,
        addresses: true,
        orders: { select: { id: true, total: true, status: true, created_at: true } }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

/**
 * Update User Profile & Password (Increments token_version on password change)
 */
async function updateProfile(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { name, phone, currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let updateData = {};
    if (name && typeof name === 'string') updateData.name = name.trim();
    if (phone && typeof phone === 'string') updateData.phone = phone.trim();

    let passwordChanged = false;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      validatePassword(newPassword);

      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect current password' });
      }

      updateData.password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      updateData.token_version = { increment: 1 };
      passwordChanged = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    const token = generateToken(updatedUser);

    res.json({
      message: passwordChanged ? 'Password changed successfully! Other sessions invalidated.' : 'Profile updated successfully!',
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Update profile error:", err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

module.exports = {
  register,
  login,
  sendOTP,
  sendRegisterOTP,
  verifyRegisterOTP,
  verifyOTPLogin,
  resetPasswordWithOTP,
  getProfile,
  updateProfile
};
