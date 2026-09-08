const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { requireAdmin } = require("../auth");
const {
  DEFAULT_SETTINGS,
  getBrandSettings,
  updateBrandSettings
} = require("../services/brandSettingsService");

// Ensure brand upload directory exists
const brandUploadDir = path.join(__dirname, "..", "..", "uploads", "brand");
if (!fs.existsSync(brandUploadDir)) {
  try {
    fs.mkdirSync(brandUploadDir, { recursive: true });
  } catch (err) {
    console.warn("[Settings] Could not create brand upload directory:", err.message);
  }
}

// Multer disk storage for local upload fallback
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, brandUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, `atelier-logo-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(png|jpe?g|svg|webp)$/i;
    if (allowed.test(file.originalname) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (.png, .jpg, .svg, .webp) are supported for the atelier logo."));
    }
  }
});

/**
 * GET /api/settings/brand
 * Public & Admin: Fetch active brand and document settings
 */
router.get("/brand", async (req, res) => {
  try {
    const settings = await getBrandSettings();
    res.json(settings);
  } catch (err) {
    console.error("GET /api/settings/brand error:", err);
    res.status(500).json({ error: "Failed to load brand settings." });
  }
});

/**
 * PUT /api/settings/brand
 * Admin only: Update brand identity, contact, GST, invoice prefix, and payment details
 * Supports file upload (`logo`), CDN URL, or JSON payload
 */
router.put("/brand", requireAdmin, upload.single("logo"), async (req, res) => {
  try {
    const body = req.body || {};

    let logoUrl = body.logo_url;
    // If a physical file was uploaded, save relative path
    if (req.file) {
      logoUrl = `/uploads/brand/${req.file.filename}`;
    }

    // Parse payment_details safely if submitted as string from multipart form
    let paymentDetails = body.payment_details;
    if (typeof paymentDetails === "string") {
      try {
        paymentDetails = JSON.parse(paymentDetails);
      } catch (e) {
        paymentDetails = {};
      }
    } else if (!paymentDetails && (body.bank_name !== undefined || body.upi_id !== undefined)) {
      paymentDetails = {
        bank_name: body.bank_name || "",
        account_name: body.account_name || "",
        account_number: body.account_number || "",
        ifsc_code: body.ifsc_code || "",
        upi_id: body.upi_id || ""
      };
    }

    const payload = {
      business_name: body.business_name,
      tagline: body.tagline,
      logo_url: logoUrl,
      gst_number: body.gst_number,
      address: body.address,
      support_email: body.support_email,
      support_phone: body.support_phone,
      website_url: body.website_url,
      instagram_url: body.instagram_url,
      instagram_handle: body.instagram_handle,
      invoice_prefix: body.invoice_prefix,
      payment_details: paymentDetails
    };

    const updated = await updateBrandSettings(payload);
    res.json({
      success: true,
      message: "Atelier brand settings updated successfully.",
      settings: updated
    });
  } catch (err) {
    console.error("PUT /api/settings/brand error:", err);
    res.status(500).json({ error: err.message || "Failed to update brand settings." });
  }
});

/**
 * POST /api/settings/brand/reset
 * Admin only: Reset to initial SUKO Atelier settings
 */
router.post("/brand/reset", requireAdmin, async (req, res) => {
  try {
    const reset = await updateBrandSettings(DEFAULT_SETTINGS);
    res.json({
      success: true,
      message: "Atelier brand settings reset to default.",
      settings: reset
    });
  } catch (err) {
    console.error("POST /api/settings/brand/reset error:", err);
    res.status(500).json({ error: "Failed to reset brand settings." });
  }
});

module.exports = router;
