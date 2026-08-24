/**
 * Startup Environment Configuration Validator
 * Enforces production security invariants and dedicated secrets.
 */

function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const errors = [];

  // 1. JWT Secret Validation
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push("Missing required environment variable: JWT_SECRET");
  } else if (isProd && jwtSecret.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters in production.");
  }

  // 2. Dedicated OTP Hash Secret Validation (NO fallback to JWT_SECRET)
  const otpHashSecret = process.env.OTP_HASH_SECRET;
  if (!otpHashSecret) {
    if (isProd) {
      errors.push("Missing required environment variable in production: OTP_HASH_SECRET");
    } else {
      process.env.OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || 'dev_insecure_otp_hash_secret_min32chars_test!';
    }
  } else if (isProd && otpHashSecret.length < 32) {
    errors.push("OTP_HASH_SECRET must be at least 32 characters in production.");
  }

  // 3. Database URL
  if (!process.env.DATABASE_URL) {
    errors.push("Missing required environment variable: DATABASE_URL");
  }

  // 4. Bcrypt rounds check
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  if (isNaN(rounds) || rounds < 10 || rounds > 14) {
    errors.push("BCRYPT_ROUNDS must be an integer between 10 and 14.");
  }

  // 5. Production Cloudinary Validation
  if (isProd) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      errors.push("Missing required production environment variable: CLOUDINARY_CLOUD_NAME");
    }
    if (!process.env.CLOUDINARY_API_KEY) {
      errors.push("Missing required production environment variable: CLOUDINARY_API_KEY");
    }
    if (!process.env.CLOUDINARY_API_SECRET) {
      errors.push("Missing required production environment variable: CLOUDINARY_API_SECRET");
    }
  }

  // 6. Razorpay Configuration Check
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("⚠️ Warning: Razorpay keys are not fully configured. Checkout gateway initialization will fail.");
  }

  if (errors.length > 0) {
    console.error("❌ Environment configuration validation failed:");
    errors.forEach(err => console.error(`   - ${err}`));
    if (isProd) {
      process.exit(1);
    }
  }
}

module.exports = { validateEnv };
