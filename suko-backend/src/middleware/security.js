// Security headers and structured request logging

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.removeHeader("X-Powered-By");

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on("finish", () => {
    // Skip noisy health check logs
    if (req.path === "/health") return;
    
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    
    const statusColor =
      status >= 500 ? "\x1b[31m" : // Red
      status >= 400 ? "\x1b[33m" : // Yellow
      status >= 300 ? "\x1b[36m" : // Cyan
      "\x1b[32m";                  // Green
    const resetColor = "\x1b[0m";

    console.log(
      `[${new Date().toISOString()}] ${method} ${url} ${statusColor}${status}${resetColor} (${duration}ms)`
    );
  });

  next();
}

module.exports = { securityHeaders, requestLogger };
