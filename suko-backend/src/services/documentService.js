const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { getBrandSettings, resolveLogoUrl } = require("./brandSettingsService");

/**
 * Load atelier logo image as a Buffer for PDFKit embedding
 * Supports remote CDN (Cloudinary/S3), local upload path, and public/logo.png fallback
 */
async function loadLogoBuffer(logoUrl) {
  try {
    // 1. Remote CDN / Cloudinary / S3 URL
    if (logoUrl && (logoUrl.startsWith("http://") || logoUrl.startsWith("https://"))) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(logoUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          return Buffer.from(arrayBuf);
        }
      } catch (fetchErr) {
        clearTimeout(timeout);
      }
    }

    // 2. Uploaded brand file path
    if (logoUrl && logoUrl.startsWith("/uploads/")) {
      const localPath = path.join(__dirname, "../..", logoUrl);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      }
    }

    // 3. Fallback: public/logo.png
    const fallbackPath = path.join(__dirname, "../../../public/logo.png");
    if (fs.existsSync(fallbackPath)) {
      return fs.readFileSync(fallbackPath);
    }
  } catch (err) {
    console.warn("⚠️ [DocumentService] Logo load warning:", err.message);
  }
  return null;
}

/**
 * Helper to format Indian Rupee (e.g. ₹4,800.00)
 */
function formatINR(amount) {
  const num = Number(amount) || 0;
  return "₹" + num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format a readable date
 */
function formatDate(dateValue) {
  try {
    const d = dateValue ? new Date(dateValue) : new Date();
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  } catch (e) {
    return new Date().toLocaleDateString("en-IN");
  }
}

/**
 * Generate luxury branded HTML document
 * @param {Object} params
 * @param {Object} params.order - Order data
 * @param {string} [params.type='invoice'] - 'invoice' | 'receipt' | 'packing_slip' | 'order_confirmation'
 * @param {Object} [params.brandSettingsOverride] - Optional brand settings override for live preview
 */
async function renderDocumentHtml({
  order,
  type = "invoice",
  brandSettingsOverride = null
}) {
  const brand = brandSettingsOverride || (await getBrandSettings());
  const docType = (type || "invoice").toLowerCase();

  // Document specific titles and badges
  const docConfig = {
    invoice: {
      title: "TAX INVOICE",
      subtitle: "Official Commercial Billing Document",
      showPricing: true,
      showPayment: true,
      badge: "ORIGINAL FOR RECIPIENT",
      accent: "#C2922E"
    },
    receipt: {
      title: "PAYMENT RECEIPT",
      subtitle: "Acknowledgment of Atelier Settlement",
      showPricing: true,
      showPayment: true,
      badge: "PAYMENT VERIFIED",
      accent: "#166534"
    },
    packing_slip: {
      title: "PACKING & FULFILLMENT SLIP",
      subtitle: "Workshop Quality Inspection & Dispatch Record",
      showPricing: false, // Refinement 5: Exclude pricing & payment info
      showPayment: false,
      badge: "FULFILLMENT COPY",
      accent: "#1E3A8A"
    },
    order_confirmation: {
      title: "ORDER CONFIRMATION",
      subtitle: "Sartorial Bespoke Requisition",
      showPricing: true,
      showPayment: true,
      badge: "ORDER RECEIVED",
      accent: "#C2922E"
    }
  };

  const config = docConfig[docType] || docConfig.invoice;

  // Safe client details
  const clientName = (order.shipping_name || order.name || order.user?.name || "Valued Patron").trim();
  const clientEmail = (order.shipping_email || order.email || order.user?.email || "—").trim();
  const clientPhone = (order.shipping_phone || order.phone || order.user?.phone || "—").trim();
  const clientAddress = [
    order.shipping_line1 || order.line1,
    order.shipping_line2 || order.line2,
    order.shipping_city || order.city,
    order.shipping_state || order.state,
    order.shipping_pincode ? `PIN: ${order.shipping_pincode}` : null,
    order.shipping_country || order.country || "India"
  ].filter(Boolean).join(", ") || "Atelier White-Glove Hand Delivery";

  // Document and order identifiers
  const documentNumber = order.invoice_number || (docType === "invoice" 
    ? `${brand.invoice_prefix || "INV-2026-"}${String(1000 + (order.id || 1))}`
    : `${docType.toUpperCase().slice(0, 3)}-2026-${String(1000 + (order.id || 1))}`);
  const orderNumber = `#SUKO-${1000 + (order.id || 0)}`;
  const docDate = formatDate(order.created_at);

  // Items breakdown
  const rawItems = Array.isArray(order.items) ? order.items : [];
  const items = rawItems.length > 0 ? rawItems : [
    {
      product_name: "Bespoke Tailored Atelier Garment",
      size: "Custom",
      quantity: 1,
      price: order.total || 4800,
      price_at_purchase: order.total || 4800
    }
  ];

  // Pricing calculations
  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const grandTotal = Number(order.total || subtotal - discount);
  const paymentMethod = (order.payment_method || "UPI").toUpperCase();
  const isPaid = (order.status === "paid" || order.status === "completed" || order.status === "delivered");
  const paymentStatus = isPaid ? "Paid & Settled" : "Pending Verification";

  // Dynamic logo resolution
  const logoUrl = resolveLogoUrl(brand.logo_url, { absoluteForEmail: false });

  // Bank & UPI details (only rendered if configured)
  const bank = brand.payment_details || {};
  const hasBankDetails = Boolean(bank.bank_name || bank.account_number || bank.upi_id);

  // Table rows HTML
  const itemsHtml = items.map((it, idx) => {
    const name = it.product?.name || it.product_name || it.name || "Handcrafted Silhouette";
    const size = it.size || "Standard";
    const qty = Number(it.quantity) || 1;
    const unitPrice = Number(it.price_at_purchase || it.price) || 0;
    const total = unitPrice * qty;

    if (config.showPricing) {
      return `
        <tr style="border-bottom: 1px solid #EAE6DF;">
          <td style="padding: 14px 12px; font-family: monospace; font-size: 11px; color: #746F68; text-align: center;">${idx + 1}</td>
          <td style="padding: 14px 12px; text-align: left;">
            <strong style="color: #111113; font-size: 13.5px; display: block; font-weight: 600;">${name}</strong>
            <span style="display: inline-block; margin-top: 4px; padding: 2px 7px; background-color: #F8F5EE; border: 1px solid #E5E0D5; border-radius: 2px; font-size: 10px; font-family: monospace; color: #55514B; text-transform: uppercase;">
              Size: ${size}
            </span>
          </td>
          <td style="padding: 14px 12px; text-align: center; font-family: monospace; font-size: 13px; color: #111113; font-weight: 600;">${qty}</td>
          <td style="padding: 14px 12px; text-align: right; font-family: monospace; font-size: 13px; color: #55514B;">${formatINR(unitPrice)}</td>
          <td style="padding: 14px 12px; text-align: right; font-family: monospace; font-size: 13.5px; color: #111113; font-weight: 700;">${formatINR(total)}</td>
        </tr>
      `;
    } else {
      // Packing slip row (NO pricing, includes fulfillment checkbox)
      return `
        <tr style="border-bottom: 1px solid #EAE6DF;">
          <td style="padding: 16px 12px; font-family: monospace; font-size: 11px; color: #746F68; text-align: center;">${idx + 1}</td>
          <td style="padding: 16px 12px; text-align: left;">
            <strong style="color: #111113; font-size: 14px; display: block; font-weight: 600;">${name}</strong>
            <span style="display: inline-block; margin-top: 4px; padding: 2px 8px; background-color: #F8F5EE; border: 1px solid #E5E0D5; border-radius: 2px; font-size: 10.5px; font-family: monospace; color: #111113; font-weight: 600;">
              SPECIFICATION: ${size}
            </span>
          </td>
          <td style="padding: 16px 12px; text-align: center; font-family: monospace; font-size: 14px; color: #111113; font-weight: 700;">${qty}</td>
          <td style="padding: 16px 12px; text-align: center; font-family: monospace; font-size: 11px; color: #746F68;">
            <div style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #111113; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></div>
            Inspected
          </td>
          <td style="padding: 16px 12px; text-align: center; font-family: monospace; font-size: 11px; color: #746F68;">
            <div style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #111113; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></div>
            Monogrammed
          </td>
        </tr>
      `;
    }
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title} - ${documentNumber}</title>
  <style>
    /* CSS Reset */
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background-color: #FAF8F5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111113;
      -webkit-font-smoothing: antialiased;
    }

    .doc-page {
      max-width: 800px;
      margin: 30px auto;
      background-color: #FFFFFF;
      border: 1px solid #EAE6DF;
      border-radius: 4px;
      padding: 48px;
      box-shadow: 0 4px 24px rgba(17, 17, 19, 0.05);
    }

    /* Print Specific Media Rules for Perfect A4 Output */
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      body {
        background-color: #FFFFFF !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .doc-page {
        border: none !important;
        box-shadow: none !important;
        margin: 0 auto !important;
        padding: 16px !important;
        max-width: 100% !important;
      }
      .page-break {
        page-break-after: always;
      }
    }

    @media only screen and (max-width: 680px) {
      .doc-page { padding: 24px 16px; margin: 10px; }
      .meta-grid { flex-direction: column !important; }
      .meta-col { width: 100% !important; margin-bottom: 16px; }
      .summary-flex { flex-direction: column !important; }
      .summary-box { width: 100% !important; }
    }
  </style>
</head>
<body>

  <!-- Screen Only Action Bar -->
  <div class="no-print" style="background-color: #111113; color: #FAF8F5; padding: 12px 24px; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.15);">
    <div style="max-width: 800px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: gap; gap: 12px;">
      <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;">
        <span style="color: #C2922E; font-weight: 700;">${brand.business_name}</span> &bull; ${config.title} (${documentNumber})
      </div>
      <div style="display: flex; items-center; gap: 10px;">
        <button onclick="window.print()" style="background-color: #FAF8F5; color: #111113; border: 1px solid #C2922E; padding: 7px 16px; font-size: 11px; font-family: monospace; font-weight: 600; text-transform: uppercase; letter-spacing: 0.10em; border-radius: 2px; cursor: pointer;">
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  </div>

  <!-- Document Sheet -->
  <div class="doc-page">

    <!-- 1. BRAND HEADER -->
    <div style="text-align: center; padding-bottom: 24px;">
      <a href="${brand.website_url}" target="_blank" style="text-decoration: none; display: inline-block;">
        <img src="${logoUrl}" alt="${brand.business_name}" style="height: 52px; width: auto; max-width: 180px; object-fit: contain; margin: 0 auto; display: block;" onerror="this.src='/logo.png'" />
      </a>
      <h1 style="margin: 14px 0 0 0; font-family: 'Times New Roman', Georgia, serif; font-size: 23px; font-weight: 400; letter-spacing: 0.28em; color: #111113; text-transform: uppercase;">
        ${brand.business_name}
      </h1>
      ${brand.tagline ? `
      <p style="margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.20em; color: #8E877E; text-transform: uppercase;">
        ${brand.tagline}
      </p>
      ` : ""}
      <!-- Gold Hairline Divider -->
      <div style="height: 1.5px; width: 48px; background-color: #C2922E; margin: 14px auto 0 auto;"></div>
    </div>

    <div style="height: 1px; background-color: #EAE6DF; width: 100%; margin-bottom: 28px;"></div>

    <!-- 2. DOCUMENT EYEBROW & META BAR -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px;">
      <div>
        <span style="display: inline-block; padding: 3px 9px; background-color: #FAF8F5; border: 1px solid #EAE6DF; border-radius: 2px; font-size: 10px; font-family: monospace; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${config.accent}; margin-bottom: 6px;">
          ${config.title}
        </span>
        <div style="font-family: 'Times New Roman', Georgia, serif; font-size: 20px; font-weight: 400; color: #111113;">
          ${documentNumber}
        </div>
        <div style="font-family: monospace; font-size: 11px; color: #746F68; margin-top: 3px;">
          Order Reference: <strong style="color: #111113;">${orderNumber}</strong> &bull; Date: ${docDate}
        </div>
      </div>

      <div style="text-align: right;">
        <span style="display: inline-block; padding: 4px 10px; background-color: #FAF8F5; border: 1px solid #D5CEBF; border-radius: 2px; font-family: monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #111113;">
          ${config.badge}
        </span>
        ${brand.gst_number ? `
        <div style="font-family: monospace; font-size: 11px; color: #111113; margin-top: 6px; font-weight: 600;">
          GSTIN: ${brand.gst_number}
        </div>
        ` : ""}
      </div>
    </div>

    <!-- 3. BILL TO & ATELIER INFO (DUAL COLUMN) -->
    <div class="meta-grid" style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 32px; background-color: #FAF8F5; border: 1px solid #ECE7DE; border-radius: 4px; padding: 20px 24px;">
      <!-- Column 1: Bill To -->
      <div class="meta-col" style="flex: 1;">
        <span style="font-size: 9.5px; font-family: monospace; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #C2922E; display: block; margin-bottom: 6px;">
          ${docType === "packing_slip" ? "SHIP TO / RECIPIENT" : "BILL TO / PATRON"}
        </span>
        <strong style="font-size: 14px; color: #111113; font-weight: 600; display: block; margin-bottom: 4px;">
          ${clientName}
        </strong>
        <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #55514B;">
          ${clientAddress}<br/>
          Contact: ${clientPhone} &bull; ${clientEmail}
        </p>
      </div>

      <!-- Column 2: Atelier Issuer Info -->
      <div class="meta-col" style="flex: 1; text-align: right;">
        <span style="font-size: 9.5px; font-family: monospace; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #8E877E; display: block; margin-bottom: 6px;">
          ISSUED BY ATELIER
        </span>
        <strong style="font-size: 13.5px; color: #111113; font-weight: 600; display: block; margin-bottom: 4px;">
          ${brand.business_name}
        </strong>
        <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #55514B;">
          ${brand.address || "Atelier Flagship, Mumbai, India"}<br/>
          Concierge: ${brand.support_email}<br/>
          Web: ${brand.website_url.replace(/^https?:\/\//, "")}
        </p>
      </div>
    </div>

    <!-- 4. ORDER LINE ITEMS TABLE -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
      <thead>
        <tr style="background-color: #FAF8F5; border-top: 1.5px solid #111113; border-bottom: 1.5px solid #111113;">
          <th style="padding: 10px 12px; font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #111113; font-weight: 700; width: 6%; text-align: center;">#</th>
          <th style="padding: 10px 12px; font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #111113; font-weight: 700; text-align: left;">Sartorial Garment</th>
          <th style="padding: 10px 12px; font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #111113; font-weight: 700; text-align: center; width: 12%;">Qty</th>
          ${config.showPricing ? `
          <th style="padding: 10px 12px; font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #111113; font-weight: 700; text-align: right; width: 22%;">Price</th>
          <th style="padding: 10px 12px; font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #111113; font-weight: 700; text-align: right; width: 22%;">Total</th>
          ` : `
          <th style="padding: 10px 12px; font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #111113; font-weight: 700; text-align: center; width: 24%;">Inspection</th>
          <th style="padding: 10px 12px; font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #111113; font-weight: 700; text-align: center; width: 24%;">Packaging</th>
          `}
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- 5. PRICING & PAYMENT BREAKDOWN (Exempt on Packing Slip) -->
    ${config.showPricing ? `
    <div class="summary-flex" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 32px;">
      
      <!-- Left: Payment Status & Optional Bank Details -->
      <div style="flex: 1.2;">
        <div style="background-color: #FAF8F5; border: 1px solid #ECE7DE; border-radius: 4px; padding: 18px 20px;">
          <span style="font-size: 9.5px; font-family: monospace; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #111113; display: block; margin-bottom: 8px;">
            PAYMENT SETTLEMENT
          </span>
          <table style="width: 100%; font-size: 12px; line-height: 1.7; color: #55514B;">
            <tr>
              <td style="width: 42%; font-family: monospace; color: #746F68;">Payment Method:</td>
              <td style="font-weight: 600; color: #111113;">${paymentMethod}</td>
            </tr>
            <tr>
              <td style="font-family: monospace; color: #746F68;">Status:</td>
              <td>
                <span style="display: inline-block; padding: 1px 6px; background-color: ${isPaid ? "#ECFDF5" : "#FFFBEB"}; border: 1px solid ${isPaid ? "#A7F3D0" : "#FDE68A"}; border-radius: 2px; font-size: 10px; font-family: monospace; font-weight: 600; color: ${isPaid ? "#065F46" : "#92400E"}; text-transform: uppercase;">
                  ${paymentStatus}
                </span>
              </td>
            </tr>
            ${order.transaction_id ? `
            <tr>
              <td style="font-family: monospace; color: #746F68;">Ref / Txn ID:</td>
              <td style="font-family: monospace; font-size: 11px; color: #111113;">${order.transaction_id}</td>
            </tr>
            ` : ""}
          </table>

          <!-- Optional Bank Details: ONLY shown if configured by admin -->
          ${hasBankDetails ? `
          <div style="margin-top: 14px; pt: 12px; border-top: 1px dashed #D5CEBF;">
            <span style="font-size: 9px; font-family: monospace; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #8E877E; display: block; margin-bottom: 4px;">
              Direct Bank Transfer / Wire Details
            </span>
            <div style="font-size: 11px; font-family: monospace; color: #55514B; line-height: 1.6;">
              ${bank.bank_name ? `Bank: <strong>${bank.bank_name}</strong><br/>` : ""}
              ${bank.account_name ? `A/C Name: ${bank.account_name}<br/>` : ""}
              ${bank.account_number ? `A/C No: <strong>${bank.account_number}</strong><br/>` : ""}
              ${bank.ifsc_code ? `IFSC: ${bank.ifsc_code}<br/>` : ""}
              ${bank.upi_id ? `UPI: <strong>${bank.upi_id}</strong>` : ""}
            </div>
          </div>
          ` : ""}
        </div>
      </div>

      <!-- Right: Financial Grand Totals -->
      <div class="summary-box" style="flex: 1; max-width: 320px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; line-height: 2;">
          <tr>
            <td style="color: #746F68;">Subtotal</td>
            <td style="text-align: right; font-family: monospace; color: #111113; font-weight: 500;">${formatINR(subtotal)}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td style="color: #166534;">Privilege Savings</td>
            <td style="text-align: right; font-family: monospace; color: #166534; font-weight: 600;">-${formatINR(discount)}</td>
          </tr>
          ` : ""}
          <tr>
            <td style="color: #746F68;">White-Glove Delivery</td>
            <td style="text-align: right; font-family: monospace; font-size: 11px; color: #C2922E; font-weight: 700; text-transform: uppercase;">COMPLIMENTARY</td>
          </tr>
          ${brand.gst_number ? `
          <tr>
            <td style="color: #746F68;">Taxes &amp; Duties (GST)</td>
            <td style="text-align: right; font-family: monospace; font-size: 11px; color: #746F68;">Inclusive</td>
          </tr>
          ` : ""}
          <tr>
            <td colspan="2" style="padding-top: 8px;">
              <div style="background-color: #FAF8F5; border: 1.5px solid #C2922E; border-radius: 3px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-family: monospace; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #111113;">Total Amount</span>
                <span style="font-size: 17px; font-weight: 700; color: #111113; font-family: monospace;">${formatINR(grandTotal)}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

    </div>
    ` : `
    <!-- Packing Slip Sign-off Section -->
    <div style="border: 1px solid #ECE7DE; border-radius: 4px; padding: 20px; margin-bottom: 32px; background-color: #FAF8F5;">
      <span style="font-size: 10px; font-family: monospace; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: #1E3A8A; display: block; margin-bottom: 12px;">
        ATELIER DISPATCH &amp; PACKING VERIFICATION
      </span>
      <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 11px; font-family: monospace; color: #55514B;">
        <div style="flex: 1; border-top: 1px dashed #D5CEBF; padding-top: 8px;">
          Packed By: _____________________
        </div>
        <div style="flex: 1; border-top: 1px dashed #D5CEBF; padding-top: 8px;">
          QA Inspector: _____________________
        </div>
        <div style="flex: 1; border-top: 1px dashed #D5CEBF; padding-top: 8px;">
          Dispatch Date: _____________________
        </div>
      </div>
    </div>
    `}

    <!-- 6. LUXURY FOOTER -->
    <div style="border-top: 1px solid #EAE6DF; padding-top: 24px; text-align: center; font-size: 11px; color: #8E877E; line-height: 1.8;">
      <a href="${brand.website_url}" target="_blank" style="text-decoration: none; display: inline-block;">
        <img src="${logoUrl}" alt="${brand.business_name}" style="height: 26px; width: auto; max-width: 85px; object-fit: contain; margin: 0 auto 10px auto; display: block; opacity: 0.85;" onerror="this.src='/logo.png'" />
      </a>
      <p style="margin: 0; font-family: 'Times New Roman', Georgia, serif; font-size: 14px; font-style: italic; color: #111113; margin-bottom: 8px;">
        Thank you for choosing ${brand.business_name}. Handcrafted for timeless distinction.
      </p>
      <div>
        Website: <a href="${brand.website_url}" target="_blank" style="color: #111113; text-decoration: underline; font-weight: 500;">${brand.website_url.replace(/^https?:\/\//, "")}</a>
        &bull;
        Instagram: <a href="${brand.instagram_url}" target="_blank" style="color: #C2922E; text-decoration: underline; font-weight: 500;">${brand.instagram_handle || "@icwbysuko"}</a>
        &bull;
        Concierge: <a href="mailto:${brand.support_email}" style="color: #111113; text-decoration: underline;">${brand.support_email}</a>
      </div>
      <div style="font-size: 9.5px; color: #A49E93; margin-top: 6px; font-family: monospace;">
        &copy; 2026 ${brand.business_name}. All rights reserved.
      </div>
    </div>

  </div>

</body>
</html>`;
}

/**
 * Generate binary PDF Buffer using PDFKit
 * Streams pure vector PDF directly to client / Resend email attachment
 * @param {Object} params
 * @param {Object} params.order
 * @param {string} [params.type='invoice']
 * @returns {Promise<Buffer>}
 */
async function generateDocumentPdf({ order, type = "invoice" }) {
  const brand = await getBrandSettings();
  const logoBuffer = await loadLogoBuffer(brand.logo_url);
  const docType = (type || "invoice").toLowerCase();
  const isPackingSlip = docType === "packing_slip";

  const clientName = (order.shipping_name || order.name || order.user?.name || "Valued Patron").trim();
  const clientEmail = (order.shipping_email || order.email || order.user?.email || "—").trim();
  const clientPhone = (order.shipping_phone || order.phone || order.user?.phone || "—").trim();
  const clientAddress = [
    order.shipping_line1 || order.line1,
    order.shipping_city || order.city,
    order.shipping_state || order.state,
    order.shipping_pincode
  ].filter(Boolean).join(", ") || "Atelier Delivery Address";

  const documentNumber = order.invoice_number || `${brand.invoice_prefix || "INV-2026-"}${String(1000 + (order.id || 1))}`;
  const orderNumber = `#SUKO-${1000 + (order.id || 0)}`;
  const docDate = formatDate(order.created_at);

  const rawItems = Array.isArray(order.items) ? order.items : [];
  const items = rawItems.length > 0 ? rawItems : [
    {
      product_name: "Bespoke Tailored Atelier Garment",
      size: "Custom",
      quantity: 1,
      price: order.total || 4800,
      price_at_purchase: order.total || 4800
    }
  ];

  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const grandTotal = Number(order.total || subtotal - discount);
  const paymentMethod = (order.payment_method || "UPI").toUpperCase();
  const isPaid = (order.status === "paid" || order.status === "completed" || order.status === "delivered");
  const paymentStatus = isPaid ? "PAID & SETTLED" : "PENDING";

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 45, right: 45 }
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Palette
      const cBlack = "#111113";
      const cGold = "#C2922E";
      const cMuted = "#746F68";
      const cLine = "#EAE6DF";

      // 1. BRAND HEADER & LOGO EMBLEM
      if (logoBuffer) {
        try {
          const logoWidth = 80;
          const logoX = (doc.page.width - logoWidth) / 2;
          doc.image(logoBuffer, logoX, doc.y, { width: logoWidth });
          doc.moveDown(0.35);
        } catch (imgErr) {
          console.warn("⚠️ [PDFKit] Header logo embed note:", imgErr.message);
        }
      }

      doc.fontSize(16).fillColor(cBlack).font("Helvetica-Bold").text(brand.business_name.toUpperCase(), { align: "center", characterSpacing: 3 });
      if (brand.tagline) {
        doc.moveDown(0.2);
        doc.fontSize(8).fillColor(cMuted).font("Helvetica").text(brand.tagline.toUpperCase(), { align: "center", characterSpacing: 2 });
      }

      // Gold line
      doc.moveDown(0.5);
      const centerX = doc.page.width / 2;
      doc.rect(centerX - 24, doc.y, 48, 1.5).fill(cGold);

      doc.moveDown(1);
      doc.rect(45, doc.y, doc.page.width - 90, 0.8).fill(cLine);
      doc.moveDown(0.8);

      // 2. DOCUMENT METADATA
      const metaY = doc.y;
      const docTitle = isPackingSlip ? "PACKING & FULFILLMENT SLIP" : (docType === "receipt" ? "PAYMENT RECEIPT" : "TAX INVOICE");

      doc.fontSize(12).fillColor(cBlack).font("Helvetica-Bold").text(docTitle, 45, metaY);
      doc.fontSize(9.5).fillColor(cMuted).font("Helvetica").text(`No: ${documentNumber}`);
      doc.text(`Order: ${orderNumber}  |  Date: ${docDate}`);

      if (brand.gst_number) {
        doc.text(`GSTIN: ${brand.gst_number}`);
      }

      // Right Side: Status Badge
      const badgeText = isPackingSlip ? "FULFILLMENT COPY" : (isPaid ? "ORIGINAL • PAID" : "PAYMENT PENDING");
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(isPaid ? "#065F46" : cBlack)
        .text(badgeText, doc.page.width - 200, metaY, { width: 155, align: "right" });

      doc.moveDown(1.2);
      const boxY = doc.y;

      // 3. DUAL ADDRESS BOX
      doc.rect(45, boxY, doc.page.width - 90, 68).fillAndStroke("#FAF8F5", cLine);

      // Left: Client
      doc.fillColor(cGold).fontSize(7.5).font("Helvetica-Bold").text(isPackingSlip ? "DELIVERY DESTINATION" : "BILL TO", 55, boxY + 8);
      doc.fillColor(cBlack).fontSize(9).font("Helvetica-Bold").text(clientName, 55, boxY + 20);
      doc.fillColor(cMuted).fontSize(8).font("Helvetica").text(`${clientAddress}\nPhone: ${clientPhone} | ${clientEmail}`, 55, boxY + 32, { width: 230 });

      // Right: Atelier
      doc.fillColor(cMuted).fontSize(7.5).font("Helvetica-Bold").text("ISSUED BY", doc.page.width - 260, boxY + 8, { width: 200, align: "right" });
      doc.fillColor(cBlack).fontSize(9).font("Helvetica-Bold").text(brand.business_name, doc.page.width - 260, boxY + 20, { width: 200, align: "right" });
      doc.fillColor(cMuted).fontSize(8).font("Helvetica").text(`${brand.address}\n${brand.support_email}`, doc.page.width - 260, boxY + 32, { width: 200, align: "right" });

      doc.y = boxY + 80;

      // 4. ITEMS TABLE HEADER
      const tableTop = doc.y;
      doc.rect(45, tableTop, doc.page.width - 90, 20).fill("#FAF8F5");
      doc.rect(45, tableTop, doc.page.width - 90, 1).fill(cBlack);
      doc.rect(45, tableTop + 20, doc.page.width - 90, 1).fill(cBlack);

      doc.fillColor(cBlack).fontSize(8).font("Helvetica-Bold");
      doc.text("#", 55, tableTop + 6, { width: 25 });
      doc.text("SARTORIAL GARMENT", 80, tableTop + 6, { width: 220 });
      doc.text("QTY", 300, tableTop + 6, { width: 40, align: "center" });

      if (!isPackingSlip) {
        doc.text("UNIT PRICE", 350, tableTop + 6, { width: 90, align: "right" });
        doc.text("TOTAL", 445, tableTop + 6, { width: 100, align: "right" });
      } else {
        doc.text("INSPECTED", 360, tableTop + 6, { width: 80, align: "center" });
        doc.text("PACKED", 445, tableTop + 6, { width: 80, align: "center" });
      }

      // TABLE ROWS
      let rowY = tableTop + 24;
      items.forEach((it, i) => {
        const name = it.product?.name || it.product_name || it.name || "Handcrafted Silhouette";
        const size = it.size || "Standard";
        const qty = Number(it.quantity) || 1;
        const unit = Number(it.price_at_purchase || it.price) || 0;
        const tot = unit * qty;

        doc.fillColor(cMuted).fontSize(8).font("Helvetica").text(String(i + 1), 55, rowY, { width: 25 });
        doc.fillColor(cBlack).fontSize(8.5).font("Helvetica-Bold").text(name, 80, rowY, { width: 220 });
        doc.fillColor(cMuted).fontSize(7).font("Helvetica").text(`Size: ${size}`, 80, rowY + 11, { width: 220 });
        doc.fillColor(cBlack).fontSize(8.5).font("Helvetica").text(String(qty), 300, rowY, { width: 40, align: "center" });

        if (!isPackingSlip) {
          doc.fillColor(cMuted).text(formatINR(unit), 350, rowY, { width: 90, align: "right" });
          doc.fillColor(cBlack).font("Helvetica-Bold").text(formatINR(tot), 445, rowY, { width: 100, align: "right" });
        } else {
          doc.fillColor(cMuted).text("[   ] Checked", 360, rowY, { width: 80, align: "center" });
          doc.text("[   ] Ready", 445, rowY, { width: 80, align: "center" });
        }

        rowY += 24;
        doc.rect(45, rowY - 2, doc.page.width - 90, 0.5).fill(cLine);
      });

      doc.y = rowY + 10;

      // 5. SUMMARY & TOTALS (Omit pricing on packing slip)
      if (!isPackingSlip) {
        const sumY = doc.y;

        // Payment info box left
        doc.rect(45, sumY, 240, 60).fillAndStroke("#FAF8F5", cLine);
        doc.fillColor(cBlack).fontSize(8).font("Helvetica-Bold").text("PAYMENT DETAILS", 55, sumY + 8);
        doc.fillColor(cMuted).fontSize(7.5).font("Helvetica")
          .text(`Method: ${paymentMethod}\nStatus: ${paymentStatus}\nWhite-Glove Atelier Delivery`, 55, sumY + 20, { width: 220 });

        // Totals table right
        const tRightX = 320;
        doc.fillColor(cMuted).fontSize(8.5).font("Helvetica").text("Subtotal:", tRightX, sumY, { width: 110 });
        doc.fillColor(cBlack).text(formatINR(subtotal), tRightX + 110, sumY, { width: 110, align: "right" });

        let curTotY = sumY + 14;
        if (discount > 0) {
          doc.fillColor("#166534").text("Privilege Discount:", tRightX, curTotY, { width: 110 });
          doc.text(`-${formatINR(discount)}`, tRightX + 110, curTotY, { width: 110, align: "right" });
          curTotY += 14;
        }

        doc.fillColor(cMuted).text("Shipping:", tRightX, curTotY, { width: 110 });
        doc.fillColor(cGold).font("Helvetica-Bold").text("COMPLIMENTARY", tRightX + 110, curTotY, { width: 110, align: "right" });
        curTotY += 18;

        // Grand Total Box
        doc.rect(tRightX, curTotY, 225, 24).fillAndStroke("#FAF8F5", cGold);
        doc.fillColor(cBlack).fontSize(9.5).font("Helvetica-Bold").text("TOTAL AMOUNT", tRightX + 10, curTotY + 7);
        doc.fontSize(11).text(formatINR(grandTotal), tRightX + 100, curTotY + 6, { width: 115, align: "right" });

        doc.y = curTotY + 40;
      } else {
        // Packing QA Checklist
        const qaY = doc.y;
        doc.rect(45, qaY, doc.page.width - 90, 40).fillAndStroke("#FAF8F5", cLine);
        doc.fillColor(cBlack).fontSize(8).font("Helvetica-Bold").text("DISPATCH VERIFICATION & QUALITY ASSURANCE", 55, qaY + 8);
        doc.fillColor(cMuted).fontSize(7.5).font("Helvetica")
          .text("Packed By: __________________     Inspected By: __________________     Date: __________________", 55, qaY + 22);
        doc.y = qaY + 55;
      }

      // 6. LUXURY FOOTER
      const footY = Math.max(doc.y, doc.page.height - 95);
      doc.rect(45, footY, doc.page.width - 90, 0.8).fill(cLine);

      let textY = footY + 8;
      if (logoBuffer) {
        try {
          const footLogoW = 22;
          const footLogoX = (doc.page.width - footLogoW) / 2;
          doc.image(logoBuffer, footLogoX, footY + 4, { width: footLogoW });
          textY = footY + 18;
        } catch (imgErr) {}
      }

      doc.fillColor(cBlack).fontSize(8.5).font("Helvetica-Oblique")
        .text(`Thank you for choosing ${brand.business_name}. Handcrafted for timeless distinction.`, 45, textY, { align: "center" });

      doc.fillColor(cMuted).fontSize(7.5).font("Helvetica")
        .text(`Website: ${brand.website_url.replace(/^https?:\/\//, "")}   |   Instagram: ${brand.instagram_handle || "@icwbysuko"}   |   Concierge: ${brand.support_email}`, 45, textY + 12, { align: "center" });

      doc.fontSize(6.5).fillColor("#A49E93")
        .text(`© 2026 ${brand.business_name}. All rights reserved.`, 45, textY + 24, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  formatINR,
  formatDate,
  renderDocumentHtml,
  generateDocumentPdf
};
