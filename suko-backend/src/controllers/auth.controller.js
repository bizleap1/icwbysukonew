import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { JWT_SECRET } from '../config/env.js';
import { sendWelcomeEmail, sendPasswordResetOtpEmail, sendLoginOtpEmail, sendRegisterOtpEmail } from '../utils/email.service.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password_hash,
        role: 'customer',
        last_login: new Date(),
        last_active_at: new Date(),
        is_online: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    sendWelcomeEmail(user.email, user.name);

    // Record login/registration event in audit log
    try {
      await prisma.adminAuditLog.create({
        data: {
          actor_id: user.id,
          actor_email: user.email,
          action: 'user.registered',
          entity: 'User',
          entity_id: String(user.id),
          metadata: { name: user.name, role: user.role, method: 'password' },
        },
      });
    } catch (_) {}

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_login: now,
        last_active_at: now,
        is_online: true,
      },
    });

    // Record live login event in audit log
    try {
      await prisma.adminAuditLog.create({
        data: {
          actor_id: user.id,
          actor_email: user.email,
          action: 'user.login',
          entity: 'User',
          entity_id: String(user.id),
          metadata: { name: user.name, role: user.role, method: 'password' },
        },
      });
    } catch (_) {}

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

export const getMe = async (req, res) => {
  const user = req.user;
  const nameParts = (user.name || '').split(' ');
  const formattedUser = {
    ...user,
    firstName: nameParts[0] || user.name || 'User',
    lastName: nameParts.slice(1).join(' ') || '',
  };
  res.json(formattedUser);
};

export const updateProfile = async (req, res) => {
  try {
    const { name, firstName, lastName, phone, email } = req.body;
    let displayName = name;
    if (!displayName && (firstName || lastName)) {
      displayName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(displayName && { name: displayName }),
        ...(phone !== undefined && { phone }),
        ...(email && { email }),
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    const nameParts = (updated.name || '').split(' ');
    const formattedUser = {
      ...updated,
      firstName: nameParts[0] || updated.name || 'User',
      lastName: nameParts.slice(1).join(' ') || '',
    };

    res.json(formattedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this email address.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { reset_otp: otp, reset_otp_expiry: expiry },
    });

    await sendPasswordResetOtpEmail(user.email, otp);

    res.json({ message: `Password reset OTP sent to ${user.email}` });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this email address.' });
    }

    // CRITICAL: verify OTP matches and has not expired before allowing password reset
    if (!user.reset_otp || user.reset_otp !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }
    if (!user.reset_otp_expiry || new Date() > user.reset_otp_expiry) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash, reset_otp: null, reset_otp_expiry: null },
    });

    res.json({ message: 'Password updated successfully! You can now sign in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

export const makeAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
      select: { id: true, email: true, role: true },
    });
    res.json({ success: true, message: 'User granted Admin privileges', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error granting admin role', error: error.message });
  }
};

/**
 * Set user role — super_admin only
 * Supports: customer, cashier, inventory_staff, store_manager, admin, super_admin
 */
export const setUserRole = async (req, res) => {
  try {
    const { email, role } = req.body;
    const validRoles = ['customer', 'cashier', 'inventory_staff', 'store_manager', 'admin', 'super_admin'];

    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required' });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });

    res.json({ success: true, message: `User role updated to ${role}`, user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'User not found with that email' });
    }
    res.status(500).json({ success: false, message: 'Error updating user role', error: error.message });
  }
};

export const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const defaultPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          password_hash: defaultPassword,
          role: 'customer'
        }
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { reset_otp: otp, reset_otp_expiry: expiry }
    });

    await sendLoginOtpEmail(email, otp);

    res.json({ message: `Login OTP sent successfully to ${email}` });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.reset_otp !== String(otp).trim() || new Date() > user.reset_otp_expiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_otp: null,
        reset_otp_expiry: null,
        last_login: now,
        last_active_at: now,
        is_online: true,
      },
    });

    // Record live login event in audit log
    try {
      await prisma.adminAuditLog.create({
        data: {
          actor_id: user.id,
          actor_email: user.email,
          action: 'user.login_otp',
          entity: 'User',
          entity_id: String(user.id),
          metadata: { name: user.name, role: user.role, method: 'otp' },
        },
      });
    } catch (_) {}

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'OTP Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};

const registrationOtpStore = new Map();

export const sendRegisterOtp = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    if (!email || !firstName) {
      return res.status(400).json({ message: 'First name and email are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account already exists with this email address. Please Sign In.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;

    registrationOtpStore.set(email.toLowerCase().trim(), {
      otp,
      expiry,
      firstName,
      lastName,
      phone
    });

    const fullName = `${firstName} ${lastName || ''}`.trim();
    await sendRegisterOtpEmail(email, otp, fullName);

    res.json({ message: `Verification OTP sent to ${email}` });
  } catch (error) {
    res.status(500).json({ message: 'Error sending registration OTP', error: error.message });
  }
};

export const verifyRegisterOtp = async (req, res) => {
  try {
    const { firstName, lastName, email, otp, password, phone } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and password are required' });
    }

    const emailKey = email.toLowerCase().trim();
    const record = registrationOtpStore.get(emailKey);

    if (!record || record.otp !== String(otp).trim() || Date.now() > record.expiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP code. Please request a new OTP.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const fullName = `${firstName || record.firstName || ''} ${lastName || record.lastName || ''}`.trim();
    const finalPhone = phone || record.phone || null;
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: emailKey,
        phone: finalPhone,
        password_hash,
        role: 'customer',
        last_login: now,
        last_active_at: now,
        is_online: true,
      }
    });

    registrationOtpStore.delete(emailKey);
    sendWelcomeEmail(user.email, user.name);

    // Record registration audit log
    try {
      await prisma.adminAuditLog.create({
        data: {
          actor_id: user.id,
          actor_email: user.email,
          action: 'user.registered_otp',
          entity: 'User',
          entity_id: String(user.id),
          metadata: { name: user.name, role: user.role, method: 'otp' },
        },
      });
    } catch (_) {}

    // Issue a login token immediately so the client can auto sign-in after verification
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating account', error: error.message });
  }
};

/**
 * User Heartbeat / Activity Ping — updates last_active_at and is_online in real time
 */
export const heartbeat = async (req, res) => {
  try {
    if (req.user?.id) {
      const now = new Date();
      await prisma.user.update({
        where: { id: req.user.id },
        data: { last_active_at: now, is_online: true },
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(200).json({ success: false }); // Graceful
  }
};

/**
 * User Logout — sets is_online to false and logs event
 */
export const logout = async (req, res) => {
  try {
    if (req.user?.id) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { is_online: false, last_active_at: new Date() },
      });

      try {
        await prisma.adminAuditLog.create({
          data: {
            actor_id: req.user.id,
            actor_email: req.user.email,
            action: 'user.logout',
            entity: 'User',
            entity_id: String(req.user.id),
            metadata: { name: req.user.name, role: req.user.role },
          },
        });
      } catch (_) {}
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.json({ success: true });
  }
};

/**
 * Real-Time Active Users & Live Login Audit Log (Admin Only)
 */
export const getRealtimeLogins = async (req, res) => {
  try {
    const activeThreshold = new Date(Date.now() - 5 * 60 * 1000); // Active in last 5 minutes

    // 1. Fetch currently online & recent users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        last_login: true,
        last_active_at: true,
        is_online: true,
        created_at: true,
      },
      orderBy: { last_active_at: 'desc' },
      take: 50,
    });

    const activeUsers = users.map((u) => {
      const isOnline = Boolean(
        u.is_online || (u.last_active_at && new Date(u.last_active_at) >= activeThreshold)
      );
      return {
        ...u,
        is_online: isOnline,
        status: isOnline ? 'ONLINE' : 'OFFLINE',
      };
    });

    const onlineCount = activeUsers.filter((u) => u.is_online).length;

    // 2. Fetch live login events from AdminAuditLog
    const recentLoginLogs = await prisma.adminAuditLog.findMany({
      where: {
        action: {
          in: ['user.login', 'user.login_otp', 'user.registered', 'user.registered_otp', 'user.logout'],
        },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
      include: {
        actor: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    res.json({
      success: true,
      onlineCount,
      totalUsers: users.length,
      users: activeUsers,
      recentLogs: recentLoginLogs,
    });
  } catch (error) {
    console.error('getRealtimeLogins error:', error);
    res.status(500).json({ success: false, message: 'Error fetching real-time login data', error: error.message });
  }
};
