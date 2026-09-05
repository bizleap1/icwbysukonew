const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const OTP_SECRET = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || "suko_otp_secret_default_2026";
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const OTP_EXPIRY_MS = 10 * 60 * 1000;  // 10 minutes
const MAX_ATTEMPTS = 5;

// In-memory OTP storage:
// Registration: email -> { otpHash, name, phone, expiresAt, resendAvailableAt, attempts }
const otpStore = new Map();
// Password Reset: email -> { otpHash, name, expiresAt, resendAvailableAt, attempts }
const resetOtpStore = new Map();

// Periodic cleanup of expired OTPs every 3 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(email);
    }
  }
  for (const [email, record] of resetOtpStore.entries()) {
    if (record.expiresAt < now) {
      resetOtpStore.delete(email);
    }
  }
}, 3 * 60 * 1000).unref();

/**
 * Generate 6-digit cryptographically secure numeric OTP
 */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create or refresh an OTP for registration
 * @param {string} email
 * @param {Object} metadata - { name, phone }
 */
async function createRegistrationOtp(email, metadata = {}) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const now = Date.now();

  const existing = otpStore.get(normalizedEmail);
  if (existing && existing.resendAvailableAt > now) {
    const waitSeconds = Math.ceil((existing.resendAvailableAt - now) / 1000);
    return {
      success: false,
      cooldown: true,
      waitSeconds,
      error: `Please wait ${waitSeconds} seconds before requesting a new code.`
    };
  }

  const otp = generateOtp();
  const salt = await bcrypt.genSalt(8);
  const otpHash = await bcrypt.hash(otp, salt);

  otpStore.set(normalizedEmail, {
    otpHash,
    name: metadata.name || "",
    phone: metadata.phone || "",
    expiresAt: now + OTP_EXPIRY_MS,
    resendAvailableAt: now + RESEND_COOLDOWN_MS,
    attempts: 0
  });

  return {
    success: true,
    otp,
    resendCooldown: 30,
    expiresInMinutes: 10
  };
}

/**
 * Verify submitted OTP and generate short-lived registration authorization token
 * @param {string} email
 * @param {string} enteredOtp
 */
async function verifyRegistrationOtp(email, enteredOtp) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const cleanOtp = (enteredOtp || "").toString().trim();
  const now = Date.now();

  const record = otpStore.get(normalizedEmail);
  if (!record) {
    return {
      valid: false,
      error: "Verification code expired or not found. Please request a new code."
    };
  }

  if (record.expiresAt < now) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      error: "Verification code has expired. Please request a new code."
    };
  }

  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      error: "Too many incorrect attempts. Please request a new verification code."
    };
  }

  const isMatch = await bcrypt.compare(cleanOtp, record.otpHash);
  if (!isMatch) {
    const remainingAttempts = Math.max(0, MAX_ATTEMPTS - record.attempts);
    return {
      valid: false,
      error: `Invalid verification code. ${remainingAttempts} attempts remaining.`
    };
  }

  // Valid OTP! Delete OTP record so it cannot be reused
  otpStore.delete(normalizedEmail);

  // Issue 15-minute verification token
  const verificationToken = jwt.sign(
    {
      email: normalizedEmail,
      purpose: "register_verification",
      name: record.name,
      phone: record.phone
    },
    OTP_SECRET,
    { expiresIn: "15m" }
  );

  return {
    valid: true,
    verificationToken,
    message: "Email verified successfully."
  };
}

/**
 * Validate that the email has a valid verification token before account creation
 * @param {string} email
 * @param {string} token
 */
function validateRegistrationToken(email, token) {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, OTP_SECRET);
    const normalizedEmail = (email || "").trim().toLowerCase();
    return decoded.email === normalizedEmail && decoded.purpose === "register_verification";
  } catch (err) {
    return false;
  }
}

/**
 * Create or refresh an OTP for Password Reset
 * @param {string} email
 * @param {Object} [metadata] - { name }
 */
async function createPasswordResetOtp(email, metadata = {}) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const now = Date.now();

  const existing = resetOtpStore.get(normalizedEmail);
  if (existing && existing.resendAvailableAt > now) {
    const waitSeconds = Math.ceil((existing.resendAvailableAt - now) / 1000);
    return {
      success: false,
      cooldown: true,
      waitSeconds,
      error: `Please wait ${waitSeconds} seconds before requesting a new password reset code.`
    };
  }

  const otp = generateOtp();
  const salt = await bcrypt.genSalt(8);
  const otpHash = await bcrypt.hash(otp, salt);

  resetOtpStore.set(normalizedEmail, {
    otpHash,
    name: metadata.name || "",
    expiresAt: now + OTP_EXPIRY_MS,
    resendAvailableAt: now + RESEND_COOLDOWN_MS,
    attempts: 0
  });

  return {
    success: true,
    otp,
    resendCooldown: 30,
    expiresInMinutes: 10
  };
}

/**
 * Verify submitted OTP and generate short-lived password reset token
 * @param {string} email
 * @param {string} enteredOtp
 */
async function verifyPasswordResetOtp(email, enteredOtp) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const cleanOtp = (enteredOtp || "").toString().trim();
  const now = Date.now();

  const record = resetOtpStore.get(normalizedEmail);
  if (!record) {
    return {
      valid: false,
      error: "Reset code expired or not found. Please request a new code."
    };
  }

  if (record.expiresAt < now) {
    resetOtpStore.delete(normalizedEmail);
    return {
      valid: false,
      error: "Reset code has expired. Please request a new code."
    };
  }

  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    resetOtpStore.delete(normalizedEmail);
    return {
      valid: false,
      error: "Too many incorrect attempts. Please request a new password reset code."
    };
  }

  const isMatch = await bcrypt.compare(cleanOtp, record.otpHash);
  if (!isMatch) {
    const remainingAttempts = Math.max(0, MAX_ATTEMPTS - record.attempts);
    return {
      valid: false,
      error: `Invalid verification code. ${remainingAttempts} attempts remaining.`
    };
  }

  // Valid OTP! Delete OTP record so it cannot be reused
  resetOtpStore.delete(normalizedEmail);

  // Issue 15-minute reset token
  const resetToken = jwt.sign(
    {
      email: normalizedEmail,
      purpose: "password_reset",
      name: record.name
    },
    OTP_SECRET,
    { expiresIn: "15m" }
  );

  return {
    valid: true,
    resetToken,
    message: "Reset code verified successfully."
  };
}

/**
 * Validate that the email has a valid password reset token
 * @param {string} email
 * @param {string} token
 */
function validatePasswordResetToken(email, token) {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, OTP_SECRET);
    const normalizedEmail = (email || "").trim().toLowerCase();
    return decoded.email === normalizedEmail && decoded.purpose === "password_reset";
  } catch (err) {
    return false;
  }
}

module.exports = {
  createRegistrationOtp,
  verifyRegistrationOtp,
  validateRegistrationToken,
  createPasswordResetOtp,
  verifyPasswordResetOtp,
  validatePasswordResetToken
};
