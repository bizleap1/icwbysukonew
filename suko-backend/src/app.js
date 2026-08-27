import express from 'express';
import cors from 'cors';
import path from 'path';

// Validate environment on startup (will throw if required vars missing)
import './config/env.js';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import addressRoutes from './routes/address.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import statsRoutes from './routes/stats.routes.js';
import stockNotificationRoutes from './routes/stockNotification.routes.js';
import reviewRoutes from './routes/review.routes.js';
import posRoutes from './routes/pos.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import returnRoutes from './routes/return.routes.js';
import customerRoutes from './routes/customer.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import promotionRoutes from './routes/promotion.routes.js';

import { globalErrorHandler } from './middleware/errorHandler.middleware.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';
import {
  applySecurityHeaders,
  xssSanitizer,
  corsSecurityOptions,
  preventParameterPollution,
} from './middleware/security.middleware.js';

const app = express();

// 0. Trust proxy (required for Render, Railway, Vercel — behind reverse proxy)
app.set('trust proxy', 1);

// 1. Security HTTP Headers & CORS Hardening
app.use(applySecurityHeaders);
app.use(corsSecurityOptions);

// 2. Body Parsers with payload size bounds
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. XSS Sanitization & Parameter Pollution Guard
app.use(xssSanitizer);
app.use(preventParameterPollution);

// 4. Rate Limiting for all API routes
app.use('/api/', generalLimiter);

// 5. Static uploads folder with Cache-Control
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'public', 'uploads'), {
    maxAge: '7d',
    etag: true,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'SUKO Atelier - Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      products: '/api/products',
      categories: '/api/categories',
    },
    message: 'SUKO backend server is running smoothly.',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SUKO Backend API', timestamp: new Date().toISOString() });
});

// API Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/stock-notifications', stockNotificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/promotions', promotionRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler (MUST be last middleware — has 4 params)
app.use(globalErrorHandler);

export default app;
