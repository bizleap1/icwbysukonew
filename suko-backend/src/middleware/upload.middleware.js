const multer = require('multer');

// Memory storage holds the upload buffer in RAM for Cloudinary stream processing
const storage = multer.memoryStorage();

// Strict whitelist of permitted image MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif'
]);

// Strict extension filter
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;

const fileFilter = (req, file, cb) => {
  const isMimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase());
  const isExtAllowed = ALLOWED_EXTENSIONS.test(file.originalname);

  if (isMimeAllowed && isExtAllowed) {
    return cb(null, true);
  }

  const err = new Error('Invalid file type. Only JPEG, PNG, WebP, and AVIF garment images are permitted.');
  err.code = 'INVALID_FILE_TYPE';
  err.status = 400;
  return cb(err, false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB maximum per image
    files: 11 // 1 primary + up to 10 gallery images
  }
});

module.exports = upload;
