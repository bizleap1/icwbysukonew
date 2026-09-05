const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { signToken, requireAuth } = require("../auth");
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

module.exports = router;
