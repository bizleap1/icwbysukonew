const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Requires a valid token. Attaches decoded payload to req.user
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = (header.startsWith("Bearer ") ? header.slice(7) : null) || req.query.token;
  if (!token) return res.status(401).json({ error: "Authentication required." });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
  }
}

// Requires a valid token AND role === 'admin'
function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return;
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }
    next();
  });
}

module.exports = { signToken, requireAuth, requireAdmin };
