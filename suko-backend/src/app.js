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

// Email Delivery Test Endpoint
app.get('/health/email-test', async (req, res) => {
  const results = { steps: [] };
  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      results.provider = 'Resend';
      results.steps.push('Resend client created');
      
      const { data, error } = await resend.emails.send({
        from: 'SUKO Test <onboarding@resend.dev>',
        to: process.env.SMTP_EMAIL || 'bizleap1@gmail.com',
        subject: 'Render Email Test (Resend) - ' + new Date().toISOString(),
        text: 'This email was sent from Render server via Resend API to test email delivery.'
      });
      
      if (error) {
        results.steps.push('FAILED: ' + error.message);
        results.error = error.message;
        results.success = false;
        return res.status(500).json(results);
      }
      
      results.steps.push('Email sent via Resend');
      results.emailId = data?.id;
      results.success = true;
      res.json(results);
    } else {
      results.error = 'RESEND_API_KEY not configured';
      results.success = false;
      res.status(500).json(results);
    }
  } catch (err) {
    results.steps.push('FAILED: ' + err.message);
    results.error = err.message;
    results.success = false;
    res.status(500).json(results);
  }
});

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

// Admin Email Broadcast Endpoint
const { adminOnly } = require('./middleware/auth.middleware');
const { sendCustomAdminBroadcastEmail } = require('./utils/email.service');
const prisma = require('./prisma/client');

app.post('/api/admin/send-email', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { target, recipientEmail, subject, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message body is required' });

    if (target === 'all') {
      const users = await prisma.user.findMany({ select: { email: true } });
      const emails = [...new Set(users.map(u => u.email).filter(Boolean))];

      if (emails.length === 0) {
        return res.status(400).json({ error: 'No registered user emails found in database' });
      }

      let sentCount = 0;
      let failCount = 0;

      for (const email of emails) {
        try {
          await sendCustomAdminBroadcastEmail(email, subject, message);
          sentCount++;
          await new Promise(r => setTimeout(r, 200));
        } catch (err) {
          console.error(`Broadcast failed for ${email}:`, err.message);
          failCount++;
        }
      }
      return res.json({ 
        message: `Broadcast delivered: ${sentCount} successfully sent${failCount > 0 ? `, ${failCount} failed` : ''} (Total: ${emails.length} clients)` 
      });
    } else {
      if (!recipientEmail || !recipientEmail.trim()) {
        return res.status(400).json({ error: 'Recipient email is required' });
      }
      await sendCustomAdminBroadcastEmail(recipientEmail.trim(), subject, message);
      return res.json({ message: `Email delivered to ${recipientEmail.trim()}` });
    }
  } catch (err) {
    console.error("Admin send email error:", err.message);
    res.status(500).json({ error: 'Failed to send broadcast email' });
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
