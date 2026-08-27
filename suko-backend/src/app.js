const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { validateEnv } = require('./config/env.validator');
const { authMiddleware } = require('./middleware/auth.middleware');
const { generalApiLimiter } = require('./middleware/rateLimiter.middleware');
const { handleRazorpayWebhook } = require('./controllers/webhook.controller');
const { sweepExpiredReservations } = require('./utils/inventory.service');
const { sweepExpiredOtps } = require('./utils/otp.service');

dotenv.config();

// Validate critical environment configurations at startup
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure reverse proxy trust based on environment proxy topology
const trustProxyVal = process.env.TRUST_PROXY;
if (trustProxyVal === 'true' || trustProxyVal === '1') {
  app.set('trust proxy', 1);
} else if (trustProxyVal && !isNaN(parseInt(trustProxyVal, 10))) {
  app.set('trust proxy', parseInt(trustProxyVal, 10));
} else if (trustProxyVal === 'loopback' || trustProxyVal === 'linklocal' || trustProxyVal === 'uniquelocal') {
  app.set('trust proxy', trustProxyVal);
} else {
  app.set('trust proxy', false);
}

// 1. Backend Security Headers (API-focused; frontend CSP handled at hosting layer)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: process.env.NODE_ENV === 'production' 
    ? { maxAge: 15552000, includeSubDomains: true } 
    : false
}));

// 2. Strict CORS Allowlist
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow server-to-server and tools like curl
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173,https://icwbysukonew.vercel.app,https://indiancorporatewear.com,https://www.indiancorporatewear.com')
      .split(',')
      .map(o => o.trim());
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS request blocked by security policy.'));
  },
  credentials: true
}));

// 3. Phase 1 PRESERVED: Razorpay Webhook Raw Route (MOUNTED BEFORE global body parsers & general rate limiting)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

// 4. Global Body Parsers with 100kb payload limit for standard API routes
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 5. Static uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Note: Root /health remains public for Render deploy health checks.
// Email test functionality is strictly restricted to authenticated Admins under /api/admin/email-test.

// Protected Test Route
app.get('/api/protected-test', authMiddleware, (req, res) => {
  res.json({ message: 'You are authenticated!', user: req.user });
});

// 6. Apply General API Rate Limiter to API routes
app.use('/api', generalApiLimiter);

// 7. Route Modules
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/stats', require('./routes/stats.routes'));
app.use('/api/addresses', require('./routes/address.routes'));
app.use('/api/wishlist', require('./routes/wishlist.routes'));
app.use('/api/coupons', require('./routes/coupon.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/stock-notifications', require('./routes/stockNotification.routes'));

// Broadcast lock to prevent concurrent overlapping email broadcasts
let isBroadcastingActive = false;

// Admin Email Broadcast Endpoint with Batch Processing & Concurrency Protection
app.post('/api/admin/send-email', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { target, recipientEmail, subject, message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message body is required' });
    }
    const cleanSubject = (subject || 'Announcement from SUKO Atelier').trim();
    const cleanMessage = message.trim();

    if (cleanMessage.length > 10000) {
      return res.status(400).json({ error: 'Message exceeds maximum length of 10000 characters' });
    }

    if (target === 'all') {
      if (isBroadcastingActive) {
        return res.status(409).json({ error: 'Another email broadcast is currently in progress. Please wait for it to complete.' });
      }

      const users = await prisma.user.findMany({ select: { email: true } });
      const emails = [...new Set(users.map(u => u.email).filter(Boolean))];

      if (emails.length === 0) {
        return res.status(400).json({ error: 'No registered user emails found in database' });
      }

      isBroadcastingActive = true;

      // For small lists (<= 5), process synchronously to return exact results;
      // For larger lists, process in background chunks to prevent HTTP 504 gateway timeouts.
      if (emails.length <= 5) {
        let sentCount = 0;
        let failCount = 0;
        try {
          for (const email of emails) {
            try {
              await sendCustomAdminBroadcastEmail(email, cleanSubject, cleanMessage);
              sentCount++;
              await new Promise(r => setTimeout(r, 250));
            } catch (err) {
              console.error(`Broadcast error for ${email}:`, err.message);
              failCount++;
            }
          }
        } finally {
          isBroadcastingActive = false;
        }

        return res.json({ 
          message: `Broadcast delivered: ${sentCount} successfully sent${failCount > 0 ? `, ${failCount} failed` : ''} (Total: ${emails.length} clients)` 
        });
      } else {
        // Asynchronous chunked execution for large user bases
        (async () => {
          console.log(`🚀 [Admin Broadcast] Starting background broadcast to ${emails.length} recipients...`);
          const BATCH_SIZE = 5;
          let sent = 0;
          let failed = 0;
          try {
            for (let i = 0; i < emails.length; i += BATCH_SIZE) {
              const chunk = emails.slice(i, i + BATCH_SIZE);
              await Promise.all(chunk.map(async (email) => {
                try {
                  await sendCustomAdminBroadcastEmail(email, cleanSubject, cleanMessage);
                  sent++;
                } catch (e) {
                  console.error(`Broadcast failed for ${email}:`, e.message);
                  failed++;
                }
              }));
              await new Promise(r => setTimeout(r, 600)); // Respect Resend rate limits
            }
            console.log(`✅ [Admin Broadcast] Complete. Sent: ${sent}, Failed: ${failed}`);
          } finally {
            isBroadcastingActive = false;
          }
        })().catch(err => {
          console.error("Background broadcast fatal error:", err);
          isBroadcastingActive = false;
        });

        return res.status(202).json({
          message: `Broadcast initiated for ${emails.length} recipients. Processing in background batches to prevent gateway timeout.`,
          recipientCount: emails.length
        });
      }
    } else {
      if (!recipientEmail || !recipientEmail.trim()) {
        return res.status(400).json({ error: 'Recipient email is required' });
      }
      await sendCustomAdminBroadcastEmail(recipientEmail.trim(), cleanSubject, cleanMessage);
      return res.json({ message: `Email delivered to ${recipientEmail.trim()}` });
    }
  } catch (err) {
    console.error("Admin send email error:", err.message);
    res.status(500).json({ error: 'Failed to send broadcast email' });
  }
});

// Admin-Only Email Configuration Test Endpoint (Protected from public abuse)
app.post('/api/admin/email-test', authMiddleware, adminOnly, async (req, res) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ success: false, error: 'RESEND_API_KEY not configured on server' });
    }
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const targetEmail = req.body?.to || req.user?.email || 'bizleap1@gmail.com';

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'SUKO Test <noreply@indiancorporatewear.com>',
      to: targetEmail,
      subject: `Admin Gateway Email Test - ${new Date().toISOString()}`,
      text: 'Verified test email from SUKO backend admin diagnostic service.'
    });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, emailId: data?.id, deliveredTo: targetEmail });
  } catch (err) {
    console.error("Admin email test error:", err.message);
    res.status(500).json({ success: false, error: err.message });
});

// Secure Cron Trigger Endpoint for external schedulers (Render Cron Jobs, GitHub Actions, cron-job.org)
app.post('/api/cron/sweep', async (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const secret = process.env.CRON_SECRET;

  if (secret && token !== secret) {
    return res.status(401).json({ error: 'Unauthorized cron request.' });
  }

  try {
    const resSweep = await sweepExpiredReservations();
    const otpSweep = await sweepExpiredOtps();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      reservations: resSweep,
      otps: otpSweep
    });
  } catch (err) {
    console.error("Cron sweep error:", err.message);
    res.status(500).json({ error: 'Sweep failed', details: err.message });
  }
});

// 8. Global Error Handler (Production Safe: No internal stack traces or Prisma internals leaked)
app.use((err, req, res, next) => {
  console.error('Global API Error:', err.message || err);
  const status = err.status || (err.message && err.message.includes('CORS') ? 403 : 500);
  res.status(status).json({ 
    error: err.message || 'An internal server error occurred.'
  });
});

// 9. Periodic Background Sweepers (Reservations & Expired OTPs)
if (process.env.NODE_ENV !== 'test') {
  sweepExpiredReservations().catch(err => {
    console.error("Startup reservation sweep error:", err.message);
  });
  sweepExpiredOtps().catch(err => {
    console.error("Startup OTP sweep error:", err.message);
  });
  
  setInterval(() => {
    sweepExpiredReservations().catch(err => {
      console.error("Periodic reservation sweep error:", err.message);
    });
    sweepExpiredOtps().catch(err => {
      console.error("Periodic OTP sweep error:", err.message);
    });
  }, 60 * 1000);
}

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`✨ SUKO Atelier Backend running on port ${PORT}`);
  });
}

module.exports = app;
