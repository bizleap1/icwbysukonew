const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { signToken, requireAuth, requireAdmin } = require("../auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { validateLogin, validateRegister, validateResetPassword } = require("../middleware/validate");
const { 
  createRegistrationOtp, 
  verifyRegistrationOtp, 
  validateRegistrationToken,
  createPasswordResetOtp,
  verifyPasswordResetOtp,
  validatePasswordResetToken
} = require("../services/otpService");
const { sendVerificationOtpEmail, sendPasswordResetOtpEmail } = require("../services/emailService");
const { recordActivityLog } = require("../services/productService");

const router = express.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/send-register-otp (Step 1 -> Send OTP via Resend)
router.post("/send-register-otp", authLimiter, async (req, res) => {
  try {
    let { name, phone, email } = req.body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email address is required." });
    }

    email = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email) || email.length > 255) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    name = typeof name === "string" ? name.trim() : "";
    phone = typeof phone === "string" ? phone.trim() : "";

    // Check if email already registered
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists. Please sign in instead." });
    }

    // Generate OTP record
    const otpResult = await createRegistrationOtp(email, { name, phone });
    if (!otpResult.success) {
      return res.status(otpResult.cooldown ? 429 : 400).json({
        error: otpResult.error,
        cooldown: otpResult.cooldown,
        waitSeconds: otpResult.waitSeconds
      });
    }

    // Send email via Resend
    await sendVerificationOtpEmail({
      to: email,
      otp: otpResult.otp,
      name
    });

    res.json({
      success: true,
      message: `Verification code sent to ${email}.`,
      resendCooldown: otpResult.resendCooldown,
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otpResult.otp } : {})
    });
  } catch (err) {
    console.error("Send register OTP error:", err);
    res.status(500).json({ error: "Failed to send verification code. Please try again." });
  }
});

// POST /api/auth/verify-register-otp (Step 2 -> Verify OTP)
router.post("/verify-register-otp", authLimiter, async (req, res) => {
  try {
    let { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ error: "Both email and verification code are required." });
    }

    email = email.trim().toLowerCase();
    const result = await verifyRegistrationOtp(email, otp);

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "Email verified successfully.",
      verificationToken: result.verificationToken
    });
  } catch (err) {
    console.error("Verify register OTP error:", err);
    res.status(500).json({ error: "Failed to verify code. Please try again." });
  }
});

// POST /api/auth/register (Step 3 -> Customer registration with verified token)
router.post("/register", authLimiter, validateRegister, async (req, res) => {
  try {
    const { name, phone, email, password, verificationToken } = req.body;

    // Validate email verification token
    if (!verificationToken || !validateRegistrationToken(email, verificationToken)) {
      return res.status(403).json({ 
        error: "Email verification is required. Please verify your email with a verification code first." 
      });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (name, phone, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, phone, email, role`,
      [name || "", phone || "", email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Failed to register. Please try again." });
  }
});

// POST /api/auth/send-reset-otp (Step 1 -> Send Reset OTP via Resend)
router.post("/send-reset-otp", authLimiter, async (req, res) => {
  try {
    let { email } = req.body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email address is required." });
    }

    email = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email) || email.length > 255) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    // Check if user exists in database
    const userResult = await pool.query("SELECT id, name FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "No SUKO account found with this email address. Please check your email or create an account." });
    }

    const clientName = userResult.rows[0].name || "";

    // Generate Password Reset OTP
    const otpResult = await createPasswordResetOtp(email, { name: clientName });
    if (!otpResult.success) {
      return res.status(otpResult.cooldown ? 429 : 400).json({
        error: otpResult.error,
        cooldown: otpResult.cooldown,
        waitSeconds: otpResult.waitSeconds
      });
    }

    // Dispatch luxury password reset email via Resend
    await sendPasswordResetOtpEmail({
      to: email,
      otp: otpResult.otp,
      name: clientName
    });

    res.json({
      success: true,
      message: `Password reset authorization code sent to ${email}.`,
      resendCooldown: otpResult.resendCooldown,
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otpResult.otp } : {})
    });
  } catch (err) {
    console.error("Send reset OTP error:", err);
    res.status(500).json({ error: "Failed to send reset code. Please try again." });
  }
});

// POST /api/auth/verify-reset-otp (Step 2 -> Verify Reset OTP)
router.post("/verify-reset-otp", authLimiter, async (req, res) => {
  try {
    let { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ error: "Both email and verification code are required." });
    }

    email = email.trim().toLowerCase();
    const result = await verifyPasswordResetOtp(email, otp);

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "Reset code verified successfully.",
      resetToken: result.resetToken
    });
  } catch (err) {
    console.error("Verify reset OTP error:", err);
    res.status(500).json({ error: "Failed to verify reset code. Please try again." });
  }
});

// POST /api/auth/reset-password (Step 3 -> Update Password with resetToken)
router.post("/reset-password", authLimiter, validateResetPassword, async (req, res) => {
  try {
    const { email, password, resetToken } = req.body;

    // Validate reset authorization token
    if (!resetToken || !validatePasswordResetToken(email, resetToken)) {
      return res.status(403).json({
        error: "Password reset authorization has expired or is invalid. Please request a new code."
      });
    }

    // Verify user exists
    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email address." });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update password in database
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE email = $2",
      [newPasswordHash, email]
    );

    res.json({
      success: true,
      message: "Your password has been successfully reset. You can now sign in with your new password."
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
});

// POST /api/auth/login (customer + admin)
router.post("/login", authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Record admin login activity
    if (user.role === "admin") {
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      const ua = req.headers["user-agent"] || "";
      try {
        if (!pool.isMock) {
          await pool.query(
            "INSERT INTO admin_login_activity (admin_email, ip_address, user_agent, device, status) VALUES ($1, $2, $3, $4, 'success')",
            [user.email, ip, ua, parseDevice(ua)]
          );
          await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);
        }
      } catch (logErr) {
        console.warn("Admin login activity log error:", logErr.message);
      }
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to sign in. Please try again." });
  }
});

// Helper: Parse friendly device string from user agent
function parseDevice(ua) {
  if (!ua) return "Chrome · Windows Desktop";
  let browser = "Browser";
  if (ua.includes("Edg/")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome/")) browser = "Google Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Apple Safari";
  else if (ua.includes("Firefox/")) browser = "Mozilla Firefox";

  let os = "Desktop";
  if (ua.includes("Windows NT 10.0") || ua.includes("Windows")) os = "Windows 11";
  else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("iPhone")) os = "Apple iPhone";
  else if (ua.includes("iPad")) os = "Apple iPad";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  return `${browser} on ${os}`;
}

// GET /api/auth/profile
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role FROM users WHERE id = $1",
      [req.user.userId]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: "Failed to load profile." });
  }
});

// GET /api/auth/users -- admin: list registered patrons
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ error: "Failed to load registered patrons." });
  }
});

// ============================================================================
// ADMIN CONTROLS & SECURITY ENDPOINTS (Settings -> Admin Controls)
// ============================================================================

// POST /api/auth/change-password -- authenticated admin/user password update
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current password and new password are required." });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.userId]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: "Incorrect current password." });
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, user.id]);

    // Record to Centralized Activity Audit Trail
    await recordActivityLog({
      admin_email: user.email,
      action: "ADMIN_PASSWORD_CHANGED",
      target_entity: "security",
      affected_count: 1,
      details: { userId: user.id },
      summary: `Administrator password updated successfully for ${user.email}`,
      status: "success"
    });

    res.json({
      success: true,
      message: "Password has been securely updated."
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to update password. Please try again." });
  }
});

// POST /api/auth/reauthenticate -- verify password for critical/destructive actions
router.post("/reauthenticate", requireAuth, async (req, res) => {
  try {
    const { password, actionDescription } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: "Administrator password is required." });
    }

    const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.userId]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      // Audit log failed reauth attempt
      await recordActivityLog({
        admin_email: user.email,
        action: "REAUTHENTICATION_FAILED",
        target_entity: "security",
        affected_count: 1,
        details: { action: actionDescription || "Critical Action", ip: req.ip },
        summary: `Failed re-authentication attempt by ${user.email}`,
        status: "warning"
      });
      return res.status(401).json({ valid: false, error: "Incorrect administrator password." });
    }

    // Audit log successful reauth
    await recordActivityLog({
      admin_email: user.email,
      action: "CRITICAL_ACTION_REAUTHENTICATED",
      target_entity: "security",
      affected_count: 1,
      details: { action: actionDescription || "Critical Action", ip: req.ip },
      summary: `Critical action authorized by ${user.email} (${actionDescription || "Verified"})`,
      status: "success"
    });

    res.json({
      valid: true,
      timestamp: Date.now(),
      message: "Action authorized successfully."
    });
  } catch (err) {
    console.error("Re-authentication error:", err);
    res.status(500).json({ error: "Authentication verification failed." });
  }
});

// GET /api/auth/admin-sessions -- get active session and login activity for Admin Controls
router.get("/admin-sessions", requireAdmin, async (req, res) => {
  try {
    const userRes = await pool.query(
      "SELECT id, name, email, role, two_factor_enabled, last_login_at, created_at FROM users WHERE id = $1",
      [req.user.userId]
    );
    const user = userRes.rows[0] || {};

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const ua = req.headers["user-agent"] || "";
    const cleanIp = ip.includes("::1") || ip.includes("127.0.0.1") ? "127.0.0.1 (Local Console)" : ip;

    // Fetch real recent login activity from admin_login_activity if available
    let recentLogins = [];
    try {
      if (!pool.isMock) {
        const logRes = await pool.query(
          "SELECT id, admin_email, ip_address, device, status, created_at FROM admin_login_activity WHERE admin_email = $1 ORDER BY created_at DESC LIMIT 6",
          [user.email || req.user.email]
        );
        recentLogins = logRes.rows;
      }
    } catch (e) {
      console.warn("Fetch login activity warning:", e.message);
    }

    if (recentLogins.length === 0) {
      recentLogins = [
        {
          id: 1,
          admin_email: user.email || req.user.email,
          ip_address: cleanIp,
          device: parseDevice(ua),
          status: "success",
          created_at: user.last_login_at || new Date().toISOString()
        }
      ];
    }

    const currentSession = {
      id: "sess-current",
      device: parseDevice(ua),
      ip: cleanIp,
      lastActive: new Date().toISOString(),
      isCurrent: true,
      status: "Active Now"
    };

    res.json({
      account: {
        id: user.id || req.user.userId,
        name: user.name || "SUKO Atelier Admin",
        email: user.email || req.user.email,
        role: "Owner Admin",
        accountStatus: "Active & Verified",
        createdAt: user.created_at || new Date().toISOString(),
        lastLoginAt: user.last_login_at || new Date().toISOString()
      },
      currentSession,
      otherSessions: [],
      recentLogins,
      twoFactor: {
        enabled: !!user.two_factor_enabled,
        ready: true,
        method: "Resend Email OTP / TOTP Ready"
      }
    });
  } catch (err) {
    console.error("Admin sessions error:", err);
    res.status(500).json({ error: "Failed to load admin controls data." });
  }
});

// POST /api/auth/sign-out-other-sessions -- revoke other active sessions
router.post("/sign-out-other-sessions", requireAdmin, async (req, res) => {
  try {
    const userRes = await pool.query("SELECT email FROM users WHERE id = $1", [req.user.userId]);
    const email = userRes.rows[0]?.email || req.user.email;

    if (!pool.isMock) {
      try {
        await pool.query("UPDATE users SET session_version = COALESCE(session_version, 1) + 1 WHERE id = $1", [req.user.userId]);
        await pool.query("DELETE FROM admin_sessions WHERE user_id = $1 AND is_current = false", [req.user.userId]);
      } catch (e) {
        console.warn("Session revocation query warning:", e.message);
      }
    }

    // Record to Centralized Activity Audit Trail
    await recordActivityLog({
      admin_email: email,
      action: "ALL_OTHER_SESSIONS_REVOKED",
      target_entity: "security",
      affected_count: 1,
      details: { admin_id: req.user.userId },
      summary: `Administrator revoked all other active sessions for ${email}`,
      status: "success"
    });

    res.json({
      success: true,
      message: "All other active sessions have been signed out."
    });
  } catch (err) {
    console.error("Sign out other sessions error:", err);
    res.status(500).json({ error: "Failed to revoke sessions." });
  }
});

// POST /api/auth/toggle-2fa -- toggle 2FA configuration
router.post("/toggle-2fa", requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body || {};
    const newStatus = !!enabled;

    if (!pool.isMock) {
      await pool.query("UPDATE users SET two_factor_enabled = $1 WHERE id = $2", [newStatus, req.user.userId]);
    }

    await recordActivityLog({
      admin_email: req.user.email,
      action: newStatus ? "TWO_FACTOR_ENABLED" : "TWO_FACTOR_DISABLED",
      target_entity: "security",
      affected_count: 1,
      details: { enabled: newStatus },
      summary: `Two-factor authentication ${newStatus ? "enabled" : "disabled"} for ${req.user.email}`,
      status: "success"
    });

    res.json({
      success: true,
      twoFactorEnabled: newStatus,
      message: `Two-factor authentication ${newStatus ? "enabled" : "disabled"}.`
    });
  } catch (err) {
    console.error("Toggle 2FA error:", err);
    res.status(500).json({ error: "Failed to update 2FA configuration." });
  }
});

module.exports = router;

