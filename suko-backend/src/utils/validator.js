/**
 * Centralized Request Validation and Allowlisting Security Utilities
 */

const FORBIDDEN_BODY_FIELDS = Object.freeze([
  'role',
  'isAdmin',
  'is_admin',
  'user_id',
  'userId',
  'token_version',
  'tokenVersion',
  'total',
  'discount',
  'price',
  'reservation_status',
  'expires_at',
  'inventory_released_at'
]);

/**
 * Validates that an object does not contain forbidden mass-assignment fields
 * @param {object} body 
 * @throws {Error} if forbidden fields are present
 */
function rejectForbiddenFields(body, allowedCustomFields = []) {
  if (!body || typeof body !== 'object') return;
  for (const field of FORBIDDEN_BODY_FIELDS) {
    if (body[field] !== undefined && !allowedCustomFields.includes(field)) {
      const error = new Error(`Forbidden field '${field}' provided in request body.`);
      error.status = 400;
      throw error;
    }
  }
}

/**
 * Normalizes and validates an email address
 * @param {string} email 
 * @returns {string} normalized lowercase email
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    const error = new Error('A valid email address is required.');
    error.status = 400;
    throw error;
  }
  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail) || cleanEmail.length > 254) {
    const error = new Error('Invalid email format.');
    error.status = 400;
    throw error;
  }
  return cleanEmail;
}

/**
 * Validates password length using UTF-8 byte length (8 to 72 bytes)
 * strictly accounting for bcrypt's 72-byte limit without silent truncation.
 * @param {string} password 
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    const error = new Error('Password is required.');
    error.status = 400;
    throw error;
  }
  const byteLen = Buffer.byteLength(password, 'utf8');
  if (byteLen < 8) {
    const error = new Error('Password must be at least 8 characters long.');
    error.status = 400;
    throw error;
  }
  if (byteLen > 72) {
    const error = new Error('Password exceeds the maximum allowed length of 72 bytes.');
    error.status = 400;
    throw error;
  }
}

/**
 * Validates a 6-digit numeric OTP string
 * @param {string} otp 
 * @returns {string} trimmed OTP
 */
function validateOtpFormat(otp) {
  if (!otp || typeof otp !== 'string') {
    const error = new Error('A 6-digit verification code is required.');
    error.status = 400;
    throw error;
  }
  const cleanOtp = otp.trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    const error = new Error('Verification code must be exactly 6 digits.');
    error.status = 400;
    throw error;
  }
  return cleanOtp;
}

/**
 * Validates that a route ID parameter is a positive integer
 * @param {any} id 
 * @param {string} fieldName 
 * @returns {number}
 */
function validateIntegerId(id, fieldName = 'ID') {
  const num = parseInt(id, 10);
  if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
    const error = new Error(`Invalid ${fieldName}: must be a positive integer.`);
    error.status = 400;
    throw error;
  }
  return num;
}

module.exports = {
  rejectForbiddenFields,
  validateEmail,
  validatePassword,
  validateOtpFormat,
  validateIntegerId
};
