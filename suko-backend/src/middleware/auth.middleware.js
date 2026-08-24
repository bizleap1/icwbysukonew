const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

/**
 * Authenticates JWT with strict algorithm enforcement (HS256)
 * and verifies active token_version against the database for session revocation.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    if (!decoded || !decoded.userId || typeof decoded.userId !== 'number') {
      return res.status(401).json({ error: 'Malformed token payload.' });
    }

    // Verify session validity against database token_version
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, token_version: true }
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    // If token_version was incremented (e.g. password changed/reset), invalidate this token
    if (decoded.token_version !== undefined && decoded.token_version !== dbUser.token_version) {
      return res.status(401).json({ error: 'Session has been invalidated. Please log in again.' });
    }

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      token_version: dbUser.token_version
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid or forged authorization token.' });
  }
}

/**
 * Admin-only authorization middleware.
 * Verifies live database role directly instead of relying solely on token claims.
 */
async function adminOnly(req, res, next) {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, token_version: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.user.token_version !== undefined && req.user.token_version !== dbUser.token_version) {
      return res.status(401).json({ error: 'Admin session invalidated. Please log in again.' });
    }

    next();
  } catch (err) {
    console.error("adminOnly verification error:", err.message);
    res.status(500).json({ error: 'Authorization check failed.' });
  }
}

module.exports = { authMiddleware, adminOnly };
