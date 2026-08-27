/**
 * =========================================================================
 * SUKO ATELIER — CENTRAL ERROR HANDLER & APP ERROR CLASS
 * Consistent error responses. No stack trace leaks in production.
 * =========================================================================
 */

import { isProduction } from '../config/env.js';

/**
 * Custom application error with HTTP status code and machine-readable code
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common factory methods
AppError.badRequest = (message, code = 'BAD_REQUEST') => new AppError(message, 400, code);
AppError.unauthorized = (message = 'Unauthorized', code = 'UNAUTHORIZED') => new AppError(message, 401, code);
AppError.forbidden = (message = 'Forbidden', code = 'FORBIDDEN') => new AppError(message, 403, code);
AppError.notFound = (message = 'Not found', code = 'NOT_FOUND') => new AppError(message, 404, code);
AppError.conflict = (message, code = 'CONFLICT') => new AppError(message, 409, code);
AppError.validation = (message, code = 'VALIDATION_ERROR') => new AppError(message, 422, code);

/**
 * Express global error handler middleware (must have 4 params)
 */
export const globalErrorHandler = (err, req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal Server Error';

  // Prisma known errors
  if (err.code === 'P2002') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'A record with this value already exists.';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'The requested record was not found.';
  }

  // Log full error in development, minimal in production
  if (!isProduction) {
    console.error(`[${statusCode}] ${code}: ${message}`);
    if (!err.isOperational) {
      console.error(err.stack);
    }
  } else {
    // In production, always log but don't expose internals
    console.error(`[${statusCode}] ${code}: ${message}`);
  }

  const response = {
    success: false,
    code,
    message,
  };

  // Only include stack in development for non-operational errors
  if (!isProduction && !err.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async route handler wrapper — catches async errors and forwards to error handler
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
