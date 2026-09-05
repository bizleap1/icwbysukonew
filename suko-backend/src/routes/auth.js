const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { signToken, requireAuth } = require("../auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { validateLogin, validateRegister } = require("../middleware/validate");
const { 
  createRegistrationOtp, 
  verifyRegistrationOtp, 
  validateRegistrationToken 
} = require("../services/otpService");
const { sendVerificationOtpEmail } = require("../services/emailService");

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
