const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { signToken, requireAuth } = require("../auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { validateLogin, validateRegister } = require("../middleware/validate");

const router = express.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

// POST /api/auth/register  (customer self-registration)
router.post("/register", authLimiter, validateRegister, async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

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

// POST /api/auth/login  (customer + admin)
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
