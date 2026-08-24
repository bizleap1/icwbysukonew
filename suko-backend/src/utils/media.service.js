const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

// Ensure local uploads directory exists for development mode only
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(LOCAL_UPLOADS_DIR)) {
  try {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  } catch (err) {
    // Non-fatal in dev
  }
}

/**
 * Extracts Cloudinary public_id from a Cloudinary secure delivery URL.
 * Handles folder paths (e.g. suko_products/prod_12345) and version segments.
 * Returns null if the URL is not a Cloudinary asset.
 *
 * @param {string} url 
 * @returns {string|null}
 */
function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;

  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    let pathAfterUpload = url.substring(uploadIndex + '/upload/'.length);

    // Strip version prefix if present (e.g. v1724501234/)
    if (/^v\d+\//.test(pathAfterUpload)) {
      pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
    }

    // Strip file extension (.jpg, .png, .webp, etc.)
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }

    return pathAfterUpload.trim() || null;
  } catch (err) {
    return null;
  }
}

/**
 * Uploads a single in-memory buffer to Cloudinary.
 * In production (NODE_ENV=production), failures throw immediately and never write to ephemeral local disk.
 * In development, falls back to local disk only if Cloudinary is unavailable.
 * 
 * @param {Buffer} buffer 
 * @param {Object} options 
 * @returns {Promise<{ url: string, public_id: string|null, storage: 'cloudinary'|'local', format?: string, bytes?: number }>}
 */
async function uploadBuffer(buffer, options = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Invalid file buffer provided for media upload');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET
  );

  if (isCloudinaryConfigured) {
    try {
      const cloudinaryResult = await new Promise((resolve, reject) => {
        const uploadOptions = {
          folder: options.folder || 'suko_products',
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto',
          ...options
        };

        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });

        stream.end(buffer);
      });

      return {
        url: cloudinaryResult.secure_url,
        public_id: cloudinaryResult.public_id,
        storage: 'cloudinary',
        format: cloudinaryResult.format,
        bytes: cloudinaryResult.bytes
      };
    } catch (cloudinaryErr) {
      if (isProduction) {
        console.error("❌ Production Cloudinary upload failed:", cloudinaryErr.message);
        throw new Error(`Media storage error: Failed to persist image to Cloudinary (${cloudinaryErr.message}). Local fallback is strictly prohibited in production.`);
      }
      console.warn(`⚠️ Dev Cloudinary upload issue (${cloudinaryErr.message}). Falling back to local development uploads.`);
    }
  } else if (isProduction) {
    throw new Error('Production media configuration error: Cloudinary credentials are required for production uploads.');
  }

  // Development-Only Local File Persistence
  const ext = options.ext || '.jpg';
  const filename = `prod-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  const filePath = path.join(LOCAL_UPLOADS_DIR, filename);

  await fs.promises.writeFile(filePath, buffer);

  const localUrl = `http://localhost:5000/uploads/${filename}`;
  return {
    url: localUrl,
    public_id: null,
    storage: 'local',
    bytes: buffer.length
  };
}

/**
 * Atomically uploads multiple files.
 * If ANY image in the batch fails, automatically cleans up previously uploaded assets in the batch
 * and throws an error to prevent partial product/media corruption.
 * 
 * @param {Object} params
 * @param {Object} params.primaryFile
 * @param {Array} params.galleryFiles
 * @returns {Promise<{ primaryResult: Object|null, galleryResults: Array, allUrls: Array, allPublicIds: Array }>}
 */
async function uploadProductMediaAtomic({ primaryFile, galleryFiles = [] }) {
  const uploadedBatch = [];

  try {
    let primaryResult = null;
    if (primaryFile && primaryFile.buffer) {
      const ext = path.extname(primaryFile.originalname || '.jpg');
      primaryResult = await uploadBuffer(primaryFile.buffer, {
        folder: 'suko_products',
        ext
      });
      uploadedBatch.push(primaryResult);
    }

    const galleryResults = [];
    for (const file of galleryFiles) {
      if (file) {
        if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
          throw new Error('Invalid gallery image file buffer');
        }
        const ext = path.extname(file.originalname || '.jpg');
        const uploadRes = await uploadBuffer(file.buffer, {
          folder: 'suko_products',
          ext
        });
        galleryResults.push(uploadRes);
        uploadedBatch.push(uploadRes);
      }
    }

    const allUrls = uploadedBatch.map(o => o.url);
    const allPublicIds = uploadedBatch.map(o => o.public_id).filter(Boolean);

    return {
      primaryResult,
      galleryResults,
      allUrls,
      allPublicIds
    };
  } catch (err) {
    // Atomic rollback: clean up any newly uploaded assets from this failed batch
    console.error("⚠️ Media upload batch failed. Initiating atomic rollback of newly uploaded assets...");
    for (const item of uploadedBatch) {
      if (item && item.url) {
        safeDeleteAsset(item.url, null).catch(cleanupErr => {
          console.warn("Orphan cleanup warning:", cleanupErr.message);
        });
      }
    }
    throw err;
  }
}

/**
 * Safely deletes a Cloudinary or local media asset only if:
 * 1. It is not referenced by another product record in the database
 * 
 * @param {string} urlOrPublicId 
 * @param {Object} prismaClient 
 * @returns {Promise<{ success: boolean, skipped?: boolean, reason?: string }>}
 */
async function safeDeleteAsset(urlOrPublicId, prismaClient) {
  if (!urlOrPublicId) return { skipped: true, reason: 'No asset identifier provided' };

  // Check if asset is still referenced in PostgreSQL
  if (prismaClient) {
    try {
      const activeReferences = await prismaClient.product.count({
        where: {
          OR: [
            { image_url: urlOrPublicId },
            { images: { has: urlOrPublicId } },
            { cloudinary_public_id: urlOrPublicId },
            { cloudinary_public_ids: { has: urlOrPublicId } }
          ]
        }
      });

      if (activeReferences > 0) {
        return { skipped: true, reason: 'Asset is actively referenced by another product record' };
      }
    } catch (dbErr) {
      console.warn("DB reference check warning:", dbErr.message);
    }
  }

  // Handle Cloudinary Asset
  const publicId = extractCloudinaryPublicId(urlOrPublicId) || (urlOrPublicId.includes('suko_') ? urlOrPublicId : null);
  if (publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: result.result === 'ok' || result.result === 'not found', public_id: publicId };
    } catch (err) {
      return { success: false, reason: err.message };
    }
  }

  // Handle Local Asset (Development Only)
  if (urlOrPublicId.includes('/uploads/')) {
    try {
      const filename = path.basename(urlOrPublicId);
      const localPath = path.join(LOCAL_UPLOADS_DIR, filename);
      if (fs.existsSync(localPath)) {
        await fs.promises.unlink(localPath);
      }
      return { success: true, localFile: filename };
    } catch (err) {
      return { success: false, reason: err.message };
    }
  }

  return { skipped: true, reason: 'External or unmanaged asset URL' };
}

module.exports = {
  extractCloudinaryPublicId,
  uploadBuffer,
  uploadProductMediaAtomic,
  safeDeleteAsset
};
