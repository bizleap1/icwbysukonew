const cloudinary = require("cloudinary").v2;

function isCloudinaryConfigured() {
  return Boolean(
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET) ||
    process.env.CLOUDINARY_URL
  );
}

function ensureConfigured() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
  } else if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
}

// Initial configuration
ensureConfigured();

function getCloudinaryConfig() {
  ensureConfigured();
  return {
    isConfigured: isCloudinaryConfigured(),
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || (process.env.CLOUDINARY_URL ? "configured_via_url" : null),
    hasApiKey: Boolean(process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_URL),
    hasApiSecret: Boolean(process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_URL)
  };
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  getCloudinaryConfig
};
