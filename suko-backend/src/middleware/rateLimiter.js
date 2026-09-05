// Lightweight, zero-dependency in-memory sliding window rate limiter
// Protects endpoints like /api/auth/login from brute-force attacks.

function createRateLimiter({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 20, // Max requests per window
  message = "Too many requests, please try again later.",
  skipSuccessfulRequests = false,
}) {
  const hits = new Map();

  // Periodic cleanup of expired records every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (record.resetTime <= now) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref(); // Don't hold Node process open
  }

  return (req, res, next) => {
    // Determine client IP safely (supports proxies like Render/Cloudflare)
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (forwarded ? forwarded.split(",")[0].trim() : null) || req.ip || req.socket.remoteAddress || "unknown";
    const key = `${req.baseUrl}${req.path}:${ip}`;
    const now = Date.now();

    let record = hits.get(key);
    if (!record || record.resetTime <= now) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetSeconds);

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      return res.status(429).json({
        error: message,
        retryAfter: resetSeconds,
      });
    }

    // Optional: if skipSuccessfulRequests is true, decrement count on 2xx
    if (skipSuccessfulRequests) {
      res.on("finish", () => {
        if (res.statusCode < 400 && record && record.count > 0) {
          record.count -= 1;
        }
      });
    }

    next();
  };
}

// Strict limiter for sensitive authentication endpoints (Login / Register)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 15, // 15 attempts per 15 mins per IP
  message: "Too many login attempts from this IP. Please try again after 15 minutes.",
});

// General API limiter to prevent spamming
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 reqs/min
  message: "Too many requests. Please slow down.",
});

module.exports = { createRateLimiter, authLimiter, apiLimiter };
