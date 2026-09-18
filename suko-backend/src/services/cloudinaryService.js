const path = require("path");
const { cloudinary, isCloudinaryConfigured, getCloudinaryConfig } = require("../config/cloudinary");

/**
 * Extracts Cloudinary public_id from a Cloudinary secure delivery URL.
 * Handles folder paths (e.g. suko_products/garment_12345) and version segments.
 */
function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;

  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let pathAfterUpload = url.substring(uploadIndex + "/upload/".length);

    // Strip transformation and version segments (e.g. v1724501234/ or q_auto,f_auto/v123/)
    const versionMatch = pathAfterUpload.match(/(?:v\d+\/)?([^?#]+)/);
    if (versionMatch && versionMatch[1]) {
      pathAfterUpload = versionMatch[1];
    }

    // Strip extension (.jpg, .png, .webp, etc.)
    const lastDotIndex = pathAfterUpload.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }

    return pathAfterUpload.trim() || null;
  } catch (err) {
    return null;
  }
}

/**
 * Uploads an in-memory buffer directly to Cloudinary.
 * Obtains a permanent HTTPS URL.
 * 
 * @param {Buffer} buffer - In-memory image file buffer
 * @param {Object} options - Upload options (folder, tags, etc.)
 * @returns {Promise<{ url: string, public_id: string, format: string, bytes: number }>}
 */
async function uploadImageBuffer(buffer, options = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid file buffer: Expected binary Buffer for cloud media upload.");
  }

  if (!isCloudinaryConfigured()) {
    const isProduction = process.env.NODE_ENV === "production";
    const errorMsg = isProduction
      ? "Cloudinary configuration missing in production environment. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be set."
      : "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in suko-backend/.env to enable persistent cloud image uploads.";
    console.error(`[CloudinaryService] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const uploadFolder = options.folder || "suko/products";
  const uniqueId = `garment-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        public_id: options.public_id || uniqueId,
        resource_type: "image",
        quality: "auto:good",
        fetch_format: "auto",
        overwrite: false,
        tags: ["suko_atelier", "product_catalog", ...(options.tags || [])]
      },
      (error, result) => {
        if (error) {
          console.error("[CloudinaryService] Cloud upload stream error:", error);
          return reject(new Error(`Cloudinary upload failed: ${error.message || "Unknown error"}`));
        }
        if (!result || !result.secure_url) {
          return reject(new Error("Cloudinary upload failed: No secure_url returned by service."));
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Atomically uploads multiple media files (primary + gallery).
 * If any file upload fails, automatically cleans up previously uploaded assets in the batch
 * to prevent orphaned or dangling media in Cloudinary.
 * 
 * @param {Object} params
 * @param {Object} [params.primaryFile] - Multer file object with buffer
 * @param {Array} [params.galleryFiles] - Array of Multer file objects with buffer
 * @returns {Promise<{ primaryUrl: string|null, galleryUrls: string[], allUrls: string[] }>}
 */
async function uploadProductMediaAtomic({ primaryFile, galleryFiles = [] }) {
  const uploadedAssets = [];

  try {
    let primaryUrl = null;
    if (primaryFile && primaryFile.buffer) {
      const uploadRes = await uploadImageBuffer(primaryFile.buffer, {
        folder: "suko/products"
      });
      primaryUrl = uploadRes.url;
      uploadedAssets.push(uploadRes);
    }

    const galleryUrls = [];
    for (const file of galleryFiles) {
      if (file && file.buffer) {
        const uploadRes = await uploadImageBuffer(file.buffer, {
          folder: "suko/products"
        });
        galleryUrls.push(uploadRes.url);
        uploadedAssets.push(uploadRes);
      }
    }

    const allUrls = uploadedAssets.map(a => a.url);

    return {
      primaryUrl: primaryUrl || galleryUrls[0] || null,
      galleryUrls,
      allUrls
    };
  } catch (err) {
    // Atomic rollback: clean up uploaded files if batch fails
    console.warn(`[CloudinaryService] Batch upload failed. Cleaning up ${uploadedAssets.length} uploaded assets...`);
    for (const asset of uploadedAssets) {
      if (asset.public_id) {
        try {
          await cloudinary.uploader.destroy(asset.public_id);
        } catch (cleanupErr) {
          console.warn(`[CloudinaryService] Rollback cleanup warning for ${asset.public_id}:`, cleanupErr.message);
        }
      }
    }
    throw err;
  }
}

/**
 * Safely deletes a Cloudinary asset by public_id or URL.
 */
async function safeDeleteCloudinaryAsset(urlOrPublicId) {
  if (!urlOrPublicId || !isCloudinaryConfigured()) return { skipped: true };

  const publicId = extractCloudinaryPublicId(urlOrPublicId) || urlOrPublicId;
  if (!publicId) return { skipped: true };

  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return { success: res.result === "ok" || res.result === "not found", result: res.result };
  } catch (err) {
    console.warn(`[CloudinaryService] Failed to delete asset ${publicId}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  extractCloudinaryPublicId,
  uploadImageBuffer,
  uploadProductMediaAtomic,
  safeDeleteCloudinaryAsset,
  isCloudinaryConfigured,
  getCloudinaryConfig
};
