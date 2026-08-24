const rateLimit = require('express-rate-limit');

/**
 * Standardized JSON response handler for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    error: 'Too many requests from this client. Please try again later.'
  });
};

/**
 * Standard key generator helper extracting normalized email if present in request body
 */
const emailKeyGenerator = (req) => {
  const email = req.body && typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : 'anonymous';
  return email;
};

// 1. General IP Rate Limiter (Protects all general API routes)
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

// 2. IP-based Auth Limiter (Protects login, register, OTP endpoints against rapid IP-based brute forcing)
const authIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

// 3. Account / Email-based Limiter (Protects specific target accounts against distributed credential stuffing / OTP flooding across rotating IPs)
const authAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts per 15 minutes per target email
  keyGenerator: emailKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many verification attempts for this account. Please wait 15 minutes.'
    });
  }
});

// 4. Stricter OTP Generation Limiter (Limits outbound SMS/Email dispatch per target address)
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 OTP emails per 15 minutes per target email
  keyGenerator: emailKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Security rate limit exceeded: Maximum OTP requests reached for this email. Please try again later.'
    });
  }
});

module.exports = {
  generalApiLimiter,
  authIpLimiter,
  authAccountLimiter,
  otpSendLimiter
};
