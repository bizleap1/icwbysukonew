const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const { sendLoginNotificationEmail, sendOTPEmail } = require('../utils/email.service');

// Memory store for OTPs (Key: email, Value: { code, expires })
const otpStore = new Map();

async function register(req, res) {
  try {
    const { name, phone, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!name || !phone) {
      return res.status(400).json({ error: 'Full name and phone number are required for new accounts' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, phone, email, password_hash }
    });

    res.status(201).json({ id: user.id, name: user.name, phone: user.phone, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong during registration' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name, phone: user.phone, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please check your network connection.' });
  }
}

// 1. Generate & Send OTP for Login / General Purpose
async function sendOTP(req, res) {
  try {
    const { email, purpose } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if user exists for login OTP
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please register first.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in memory (10 mins expiration)
    otpStore.set(cleanEmail, {
      code: otpCode,
      expires: Date.now() + 10 * 60 * 1000
    });

    // Send email and wait for result
    await sendOTPEmail(cleanEmail, otpCode, purpose || 'Login Verification');

    res.json({
      message: `Security OTP sent to ${cleanEmail}`
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please check your email and try again.' });
  }
}

// 1b. Generate & Send OTP for Account Registration
async function sendRegisterOTP(req, res) {
  try {
    const { name, phone, email, password } = req.body;
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ error: 'Full name, phone, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(cleanEmail, {
      code: otpCode,
      expires: Date.now() + 10 * 60 * 1000,
      regData: { name, phone, email: cleanEmail, password }
    });

    // Send email and wait for result
    await sendOTPEmail(cleanEmail, otpCode, 'Account Registration Verification');

    res.json({
      message: `Registration verification OTP sent to ${cleanEmail}`
    });
  } catch (err) {
    console.error('Send Register OTP error:', err);
    res.status(500).json({ error: 'Failed to send registration OTP. Please check your email and try again.' });
  }
}

// 1c. Verify Register OTP & Create Account
async function verifyRegisterOTP(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = otpStore.get(cleanEmail);

    if (!record || !record.regData || record.code !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    if (Date.now() > record.expires) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    const { name, phone, password } = record.regData;
    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, phone, email: cleanEmail, password_hash }
    });

    otpStore.delete(cleanEmail);

    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name, phone: user.phone, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Verify register OTP error:', err);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
}

// 2. Verify OTP Login
async function verifyOTPLogin(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = otpStore.get(cleanEmail);

    if (!record || record.code !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    if (Date.now() > record.expires) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    // Clear OTP after successful verification
    otpStore.delete(cleanEmail);

    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      // Auto-create passwordless client user
      const defaultPasswordHash = await bcrypt.hash('SukoPass' + Math.random(), 10);
      user = await prisma.user.create({
        data: {
          name: cleanEmail.split('@')[0],
          phone: '',
          email: cleanEmail,
          password_hash: defaultPasswordHash
        }
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name, phone: user.phone, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Verify OTP login error:', err);
    res.status(500).json({ error: 'Failed to verify OTP login' });
  }
}

// 3. Reset Password with OTP
async function resetPasswordWithOTP(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = otpStore.get(cleanEmail);

    if (!record || record.code !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    if (Date.now() > record.expires) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Account not found with this email' });
    }

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newPasswordHash }
    });

    otpStore.delete(cleanEmail);

    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name, phone: user.phone, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Password reset successful!',
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Reset password OTP error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

// Get User Profile & Addresses
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
    console.error("Get profile error:", err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

// Update User Profile & Password
async function updateProfile(req, res) {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect current password' });
      }
      updateData.password_hash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    const token = jwt.sign(
      { userId: updatedUser.id, role: updatedUser.role, name: updatedUser.name, phone: updatedUser.phone, email: updatedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Profile updated successfully!',
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
    console.error("Update profile error:", err);
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
  updateProfile,
};
