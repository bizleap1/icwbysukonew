/**
 * Startup Environment Configuration Validator
 * Enforces strict production security invariants and dedicated secrets.
 */

function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const errors = [];

  // 1. Database Connection URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    errors.push("Missing required environment variable: DATABASE_URL");
  } else if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    errors.push("DATABASE_URL must be a valid PostgreSQL connection URI.");
  }

  // 2. JWT Secret Validation
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push("Missing required environment variable: JWT_SECRET");
  } else if (isProd) {
    if (jwtSecret.length < 32) {
      errors.push("JWT_SECRET must be at least 32 characters in production.");
    }
    if (jwtSecret.includes('change_in_production') || jwtSecret.includes('replace_with') || jwtSecret.includes('placeholder')) {
      errors.push("JWT_SECRET must not be a placeholder value in production.");
    }
  }

  // 3. Dedicated OTP Hash Secret Validation
  const otpHashSecret = process.env.OTP_HASH_SECRET;
  if (!otpHashSecret) {
    if (isProd) {
      errors.push("Missing required environment variable in production: OTP_HASH_SECRET");
    } else {
      process.env.OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || 'dev_insecure_otp_hash_secret_min32chars_test!';
    }
  } else if (isProd) {
    if (otpHashSecret.length < 32) {
      errors.push("OTP_HASH_SECRET must be at least 32 characters in production.");
    }
    if (otpHashSecret === jwtSecret) {
      errors.push("OTP_HASH_SECRET must be independent and NOT identical to JWT_SECRET.");
    }
    if (otpHashSecret.includes('replace_with') || otpHashSecret.includes('placeholder')) {
      errors.push("OTP_HASH_SECRET must not be a placeholder value in production.");
    }
  }

  // 4. Bcrypt rounds check
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  if (isNaN(rounds) || rounds < 10 || rounds > 14) {
    errors.push("BCRYPT_ROUNDS must be an integer between 10 and 14.");
  }

  // 5. Cloudinary Storage Configuration
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

  // 6. Razorpay Configuration
  if (isProd) {
    if (!process.env.RAZORPAY_KEY_ID) {
      errors.push("Missing required production environment variable: RAZORPAY_KEY_ID");
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      errors.push("Missing required production environment variable: RAZORPAY_KEY_SECRET");
    }
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      errors.push("Missing required production environment variable: RAZORPAY_WEBHOOK_SECRET");
    } else if (process.env.RAZORPAY_WEBHOOK_SECRET === process.env.RAZORPAY_KEY_SECRET) {
      errors.push("RAZORPAY_WEBHOOK_SECRET must be a distinct secret and NOT identical to RAZORPAY_KEY_SECRET.");
    }
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
