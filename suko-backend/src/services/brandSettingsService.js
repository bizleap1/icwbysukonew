const { pool } = require("../db");

const DEFAULT_SETTINGS = {
  id: 1,
  business_name: "SUKO Atelier",
  tagline: "Contemporary Indian Corporate Wear",
  logo_url: "/logo.png",
  gst_number: "",
  address: "Atelier Flagship, Mumbai, Maharashtra, India",
  support_email: "indiancorporatewearbysuko@gmail.com",
  support_phone: "+91 93703 50885",
  website_url: "https://www.indiancorporatewear.com",
  instagram_url: "https://www.instagram.com/icwbysuko?igsi=MXR4a2hwdWJmOW9lZw%3D%3D&utm_source=qr",
  instagram_handle: "@icwbysuko",
  invoice_prefix: "INV-2026-",
  next_invoice_number: 1001,
  payment_details: {
    bank_name: "",
    account_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: ""
  }
};

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds cache

/**
 * Retrieve active brand and document settings
 */
async function getBrandSettings() {
  const now = Date.now();
  if (cachedSettings && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const res = await pool.query("SELECT * FROM brand_settings WHERE id = 1 LIMIT 1");
    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      let pDetails = row.payment_details;
      if (typeof pDetails === "string") {
        try { pDetails = JSON.parse(pDetails); } catch(e) { pDetails = {}; }
      }
      cachedSettings = {
        ...DEFAULT_SETTINGS,
        ...row,
        payment_details: {
          ...DEFAULT_SETTINGS.payment_details,
          ...(pDetails || {})
        }
      };
      lastFetchTime = now;
      return cachedSettings;
    }

    // Initialize row if empty
    await pool.query(
      `INSERT INTO brand_settings (id, business_name, tagline, logo_url, gst_number, address, support_email, support_phone, website_url, instagram_url, instagram_handle, invoice_prefix, next_invoice_number, payment_details)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO NOTHING`,
      [
        DEFAULT_SETTINGS.business_name,
        DEFAULT_SETTINGS.tagline,
        DEFAULT_SETTINGS.logo_url,
        DEFAULT_SETTINGS.gst_number,
        DEFAULT_SETTINGS.address,
        DEFAULT_SETTINGS.support_email,
        DEFAULT_SETTINGS.support_phone,
        DEFAULT_SETTINGS.website_url,
        DEFAULT_SETTINGS.instagram_url,
        DEFAULT_SETTINGS.instagram_handle,
        DEFAULT_SETTINGS.invoice_prefix,
        DEFAULT_SETTINGS.next_invoice_number,
        JSON.stringify(DEFAULT_SETTINGS.payment_details)
      ]
    );

    cachedSettings = { ...DEFAULT_SETTINGS };
    lastFetchTime = now;
    return cachedSettings;
  } catch (err) {
    console.error("⚠️ [BrandSettings] Error loading brand settings, using defaults:", err.message);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update brand and document settings
 */
async function updateBrandSettings(data = {}) {
  const current = await getBrandSettings();

  const business_name = (data.business_name !== undefined ? data.business_name : current.business_name)?.trim() || DEFAULT_SETTINGS.business_name;
  const tagline = (data.tagline !== undefined ? data.tagline : current.tagline)?.trim() || "";
  const logo_url = (data.logo_url !== undefined ? data.logo_url : current.logo_url)?.trim() || DEFAULT_SETTINGS.logo_url;
  const gst_number = (data.gst_number !== undefined ? data.gst_number : current.gst_number)?.trim() || "";
  const address = (data.address !== undefined ? data.address : current.address)?.trim() || "";
  const support_email = (data.support_email !== undefined ? data.support_email : current.support_email)?.trim() || DEFAULT_SETTINGS.support_email;
  const support_phone = (data.support_phone !== undefined ? data.support_phone : current.support_phone)?.trim() || "";
  const website_url = (data.website_url !== undefined ? data.website_url : current.website_url)?.trim() || DEFAULT_SETTINGS.website_url;
  const instagram_url = (data.instagram_url !== undefined ? data.instagram_url : current.instagram_url)?.trim() || DEFAULT_SETTINGS.instagram_url;
  const instagram_handle = (data.instagram_handle !== undefined ? data.instagram_handle : current.instagram_handle)?.trim() || DEFAULT_SETTINGS.instagram_handle;
  const invoice_prefix = (data.invoice_prefix !== undefined ? data.invoice_prefix : current.invoice_prefix)?.trim() || DEFAULT_SETTINGS.invoice_prefix;

  // Safe payment details (empty by default, never fake values)
  const incomingPayment = data.payment_details || {};
  const payment_details = {
    bank_name: (incomingPayment.bank_name !== undefined ? incomingPayment.bank_name : current.payment_details?.bank_name || "")?.trim(),
    account_name: (incomingPayment.account_name !== undefined ? incomingPayment.account_name : current.payment_details?.account_name || "")?.trim(),
    account_number: (incomingPayment.account_number !== undefined ? incomingPayment.account_number : current.payment_details?.account_number || "")?.trim(),
    ifsc_code: (incomingPayment.ifsc_code !== undefined ? incomingPayment.ifsc_code : current.payment_details?.ifsc_code || "")?.trim()?.toUpperCase(),
    upi_id: (incomingPayment.upi_id !== undefined ? incomingPayment.upi_id : current.payment_details?.upi_id || "")?.trim()
  };

  const query = `
    INSERT INTO brand_settings (
      id, business_name, tagline, logo_url, gst_number, address,
      support_email, support_phone, website_url, instagram_url,
      instagram_handle, invoice_prefix, payment_details, updated_at
    ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
    ON CONFLICT (id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      tagline = EXCLUDED.tagline,
      logo_url = EXCLUDED.logo_url,
      gst_number = EXCLUDED.gst_number,
      address = EXCLUDED.address,
      support_email = EXCLUDED.support_email,
      support_phone = EXCLUDED.support_phone,
      website_url = EXCLUDED.website_url,
      instagram_url = EXCLUDED.instagram_url,
      instagram_handle = EXCLUDED.instagram_handle,
      invoice_prefix = EXCLUDED.invoice_prefix,
      payment_details = EXCLUDED.payment_details,
      updated_at = now()
    RETURNING *;
  `;

  const res = await pool.query(query, [
    business_name,
    tagline,
    logo_url,
    gst_number,
    address,
    support_email,
    support_phone,
    website_url,
    instagram_url,
    instagram_handle,
    invoice_prefix,
    JSON.stringify(payment_details)
  ]);

  cachedSettings = {
    ...DEFAULT_SETTINGS,
    ...(res.rows[0] || {}),
    payment_details
  };
  lastFetchTime = Date.now();

  return cachedSettings;
}

/**
 * Generate next sequential invoice number and advance sequence
 */
async function allocateInvoiceNumber(orderId) {
  try {
    // 1. Check if order already has an assigned invoice number
    if (orderId) {
      const orderRes = await pool.query("SELECT invoice_number FROM orders WHERE id = $1 LIMIT 1", [orderId]);
      if (orderRes.rows.length > 0 && orderRes.rows[0].invoice_number) {
        return orderRes.rows[0].invoice_number;
      }
    }

    // 2. Fetch current prefix & sequence
    const settings = await getBrandSettings();
    const prefix = settings.invoice_prefix || "INV-2026-";

    const seqRes = await pool.query(`
      UPDATE brand_settings
      SET next_invoice_number = COALESCE(next_invoice_number, 1000) + 1
      WHERE id = 1
      RETURNING invoice_prefix, next_invoice_number
    `);

    let nextNum = 1001;
    if (seqRes.rows.length > 0) {
      nextNum = seqRes.rows[0].next_invoice_number - 1;
    }

    const formattedNumber = `${prefix}${String(nextNum).padStart(4, "0")}`;

    // 3. Persist to order
    if (orderId) {
      await pool.query("UPDATE orders SET invoice_number = $1 WHERE id = $2", [formattedNumber, orderId]);
    }

    return formattedNumber;
  } catch (err) {
    console.warn("⚠️ [BrandSettings] Error allocating invoice number:", err.message);
    const prefix = "INV-2026-";
    return `${prefix}${String(1000 + Number(orderId || 1))}`;
  }
}

/**
 * Resolve logo URL safely for email vs web
 * Guarantees absolute URL for email clients (Gmail, Apple Mail)
 * Fully compatible with Cloudinary / S3 / External CDN URLs
 */
function resolveLogoUrl(logoUrl, { absoluteForEmail = false } = {}) {
  const url = (logoUrl || "").trim() || "/logo.png";
  
  // Cloudinary, S3, or any external CDN
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Base64 data URL
  if (url.startsWith("data:image/")) {
    return url;
  }

  // Relative path (e.g. /logo.png or /uploads/brand/logo-123.png)
  if (absoluteForEmail) {
    const domain = (process.env.STOREFRONT_URL || "https://www.indiancorporatewear.com").replace(/\/+$/, "");
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${domain}${cleanPath}`;
  }

  return url;
}

/**
 * Record document generation or transmission history
 */
async function recordOrderDocument({
  orderId,
  documentType = "invoice",
  documentNumber,
  pdfUrl = null,
  sentToEmail = null
}) {
  try {
    let validOrderId = null;
    if (orderId && !isNaN(Number(orderId))) {
      const chk = await pool.query("SELECT id FROM orders WHERE id = $1 LIMIT 1", [Number(orderId)]);
      if (chk.rows.length > 0) {
        validOrderId = chk.rows[0].id;
      }
    }

    const res = await pool.query(
      `INSERT INTO order_documents (order_id, document_type, document_number, pdf_url, sent_to_email, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        validOrderId,
        documentType,
        documentNumber,
        pdfUrl,
        sentToEmail,
        sentToEmail ? new Date().toISOString() : null
      ]
    );
    return res.rows[0];
  } catch (err) {
    console.warn("⚠️ [BrandSettings] Failed to log order document:", err.message);
    return null;
  }
}

/**
 * Retrieve document history for an order
 */
async function getOrderDocuments(orderId) {
  try {
    const res = await pool.query(
      `SELECT * FROM order_documents WHERE order_id = $1 ORDER BY created_at DESC`,
      [orderId]
    );
    return res.rows || [];
  } catch (err) {
    console.warn("⚠️ [BrandSettings] Failed to fetch order documents:", err.message);
    return [];
  }
}

module.exports = {
  DEFAULT_SETTINGS,
  getBrandSettings,
  updateBrandSettings,
  allocateInvoiceNumber,
  resolveLogoUrl,
  recordOrderDocument,
  getOrderDocuments
};
