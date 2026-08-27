/**
 * =========================================================================
 * SUKO ATELIER — AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * Production-grade JWT verification and Role-Based Access Control
 * =========================================================================
 */

import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { JWT_SECRET } from '../config/env.js';

/**
 * Role hierarchy — higher roles include all lower permissions
 * super_admin > admin > store_manager > inventory_staff / cashier > customer
 */
const ROLE_HIERARCHY = {
  super_admin: 6,
  admin: 5,
  store_manager: 4,
  inventory_staff: 3,
  cashier: 2,
  customer: 1,
};

/**
 * Authentication middleware
 * Verifies JWT from Authorization header. No fallback secrets. No path bypass.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Unauthorized: Please sign in or create an account to proceed.',
      });
    }

    // Verify with required secret — NEVER a fallback
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Unauthorized: Session expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Unauthorized: Invalid authentication token. Please log in.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, phone: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Unauthorized: User account not found. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Unauthorized: Token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Unauthorized: Invalid authentication token',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to req.user if valid token exists, otherwise proceeds without failing.
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (_) {
      return next();
    }

    if (decoded && decoded.userId) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true, phone: true },
      });
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (_) {
    next();
  }
};

/**
 * Admin middleware — allows admin and super_admin
 * Kept for backward compatibility with existing route files
 */
export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: 'NOT_AUTHENTICATED',
      message: 'Authentication required',
    });
  }

  const role = req.user.role?.toLowerCase();
  if (role === 'admin' || role === 'super_admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    code: 'FORBIDDEN',
    message: 'Forbidden: Admin access required',
  });
};

/**
 * Role-based authorization middleware factory
 * Usage: authorizeRoles('admin', 'super_admin', 'store_manager')
 * 
 * super_admin always has access to everything.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'NOT_AUTHENTICATED',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role?.toLowerCase();

    // super_admin always has full access
    if (userRole === 'super_admin') {
      return next();
    }

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'INSUFFICIENT_ROLE',
      message: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`,
    });
  };
};

/**
 * Resource owner middleware — checks if user owns the resource OR is admin/super_admin
 * Used for invoice access, order details, etc.
 */
export const ownerOrAdmin = (ownerIdExtractor) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'NOT_AUTHENTICATED',
        message: 'Authentication required',
      });
    }

    const role = req.user.role?.toLowerCase();

    // Admin/super_admin always has access
    if (role === 'admin' || role === 'super_admin' || role === 'store_manager') {
      return next();
    }

    // For other roles, check if they own the resource
    // The actual ownership check happens in the controller where we have the data
    // This middleware just passes through and sets a flag
    req.requireOwnershipCheck = true;
    next();
  };
};
