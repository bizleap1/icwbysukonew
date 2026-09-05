// Robust input validation and sanitization for SUKO Backend

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s\-()]{7,20}$/;

function validateLogin(req, res, next) {
  let { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Email address is required." });
  }

  email = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email) || email.length > 255) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password is required." });
  }

  req.body.email = email;
  next();
}

function validateRegister(req, res, next) {
  let { name, phone, email, password } = req.body || {};

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Email address is required." });
  }

  email = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email) || email.length > 255) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password is required." });
  }

  const pwdLength = Buffer.byteLength(password, "utf8");
  if (pwdLength < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
  }
  if (pwdLength > 72) {
    return res.status(400).json({ error: "Password cannot exceed 72 bytes." });
  }

  name = typeof name === "string" ? name.trim().slice(0, 255) : "";
  phone = typeof phone === "string" ? phone.trim().slice(0, 20) : "";

  if (phone && !PHONE_REGEX.test(phone)) {
    return res.status(400).json({ error: "Please provide a valid phone number." });
  }

  req.body.name = name;
  req.body.phone = phone;
  req.body.email = email;
  next();
}

function validateCreateOrder(req, res, next) {
  const { items, name, phone, line1, city, state, pincode } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order must include at least one item." });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== "object") {
      return res.status(400).json({ error: `Invalid item format at index ${i}.` });
    }

    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
      return res.status(400).json({ error: `Item "${item.name || i + 1}" must have a quantity between 1 and 100.` });
    }

    const price = Number(item.price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: `Invalid price for item "${item.name || i + 1}".` });
    }
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Shipping contact name is required." });
  }

  if (!phone || typeof phone !== "string" || !phone.trim() || !PHONE_REGEX.test(phone.trim())) {
    return res.status(400).json({ error: "A valid shipping contact phone number is required." });
  }

  if (!line1 || typeof line1 !== "string" || !line1.trim()) {
    return res.status(400).json({ error: "Shipping address line 1 is required." });
  }

  if (!city || typeof city !== "string" || !city.trim()) {
    return res.status(400).json({ error: "Shipping city is required." });
  }

  if (!state || typeof state !== "string" || !state.trim()) {
    return res.status(400).json({ error: "Shipping state is required." });
  }

  if (!pincode || typeof pincode !== "string" || !pincode.trim() || pincode.trim().length < 4 || pincode.trim().length > 10) {
    return res.status(400).json({ error: "Valid 6-digit postal code (pincode) is required." });
  }

  req.body.name = name.trim().slice(0, 255);
  req.body.phone = phone.trim().slice(0, 20);
  req.body.line1 = line1.trim().slice(0, 500);
  req.body.city = city.trim().slice(0, 100);
  req.body.state = state.trim().slice(0, 100);
  req.body.pincode = pincode.trim().slice(0, 10);

  next();
}

module.exports = { validateLogin, validateRegister, validateCreateOrder };
