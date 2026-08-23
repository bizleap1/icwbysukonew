const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { authMiddleware } = require('./middleware/auth.middleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow localhost, local IPs, Vercel deployments, or all origins in production
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Email Delivery Test Endpoint (for debugging Render email)
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

// Routes
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
          // Small 200ms spacing to prevent SMTP server throttling
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
    console.error("Admin send email error:", err);
    res.status(500).json({ error: err.message || 'Failed to send broadcast email' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message || err,
    details: err
  });
});

// Start Server if not imported by test module
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Suko backend server running on port ${PORT}`);
  });
}

module.exports = app;
