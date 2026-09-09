const { Resend } = require("resend");
const { getBrandSettings, allocateInvoiceNumber, resolveLogoUrl, recordOrderDocument } = require("./brandSettingsService");
const { generateDocumentPdf } = require("./documentService");

let resendClient = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
  console.log("⚡ [EmailService] Resend API client initialized successfully.");
} else {
  console.warn("⚠️  [EmailService] RESEND_API_KEY is not set. OTP codes will be printed to terminal console for local development.");
}

/**
 * Send 6-digit registration OTP email using Resend
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.otp - 6-digit verification code
 * @param {string} [params.name] - Recipient name
 */
async function sendVerificationOtpEmail({ to, otp, name }) {
  const recipientEmail = (to || "").trim().toLowerCase();
  const recipientName = (name || "").trim();

  // Always log OTP in terminal for instant dev testing
  console.log(`\n======================================================`);
  console.log(`✉️  [SUKO ATELIER EMAIL] Verification Code`);
  console.log(`👤  Client: ${recipientName || "Valued Client"} <${recipientEmail}>`);
  console.log(`🔑  OTP CODE: ${otp}`);
  console.log(`⏰  Expires in: 10 minutes`);
  console.log(`======================================================\n`);

  if (!resendClient) {
    return {
      success: true,
      delivered: false,
      devMode: true,
      message: "Resend API key not set. Verification code logged to terminal."
    };
  }

  const brand = await getBrandSettings();
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || `${brand.business_name} <noreply@indiancorporatewear.com>`;
  const supportEmail = brand.support_email || process.env.SUPPORT_EMAIL || "indiancorporatewearbysuko@gmail.com";
  const replyTo = process.env.REPLY_TO_EMAIL || supportEmail;
  const subject = `Your ${brand.business_name} verification code is ${otp}`;
  const logoUrl = resolveLogoUrl(brand.logo_url, { absoluteForEmail: true });

  const textBody = `Hello${recipientName ? ` ${recipientName}` : ""},

Your ${brand.business_name} account verification code is: ${otp}

This code is valid for 10 minutes.

If you did not request this verification code, you can safely disregard this email.

Best regards,
${brand.business_name} Concierge
${brand.tagline || "The Indian Corporate Wear"}
${brand.website_url}
${supportEmail}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>${brand.business_name} Verification</title>
      <style>
        @media only screen and (max-width: 480px) {
          .email-body { padding: 12px 6px !important; }
          .email-card { padding: 26px 18px !important; border-radius: 4px !important; width: 100% !important; box-sizing: border-box !important; }
          .logo-title { font-size: 20px !important; letter-spacing: 0.24em !important; }
          .otp-box { width: 100% !important; max-width: 100% !important; padding: 15px 10px !important; box-sizing: border-box !important; }
          .otp-code { font-size: 27px !important; letter-spacing: 5px !important; }
        }
      </style>
    </head>
    <body class="email-body" style="margin: 0; padding: 32px 16px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111113; -webkit-font-smoothing: antialiased;">
      <div class="email-card" style="max-width: 460px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 6px; padding: 36px 30px; box-shadow: 0 4px 20px rgba(17,17,19,0.03);">
        
        <!-- Atelier Header Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${brand.website_url}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img src="${logoUrl}" alt="${brand.business_name}" width="115" style="width: 115px; max-width: 115px; height: auto; display: block; margin: 0 auto; border: 0;" />
          </a>
          <h1 class="logo-title" style="margin: 10px 0 0 0; font-family: 'Times New Roman', Georgia, serif; font-size: 20px; font-weight: 400; letter-spacing: 0.26em; color: #111113; text-transform: uppercase; padding-left: 0.26em;">${brand.business_name}</h1>
          <p style="margin: 4px 0 0 0; font-size: 9.5px; font-weight: 600; color: #C2922E; letter-spacing: 0.18em; text-transform: uppercase;">${brand.tagline || "The Indian Corporate Wear • Atelier"}</p>
        </div>
        
        <div style="height: 1px; background-color: #EAE6DF; margin-bottom: 24px;"></div>
        
        <p style="font-size: 14.5px; color: #111113; margin: 0 0 12px 0; font-weight: 600;">Hello${recipientName ? ` ${recipientName}` : ""},</p>
        <p style="font-size: 13.5px; line-height: 1.6; color: #5C5C64; margin: 0 0 24px 0;">
          Welcome to ${brand.business_name}. Please use the authorization code below to verify your email address and activate your atelier account:
        </p>
        
        <div class="otp-box" style="background-color: #FAF8F5; border: 1.5px dashed #C2922E; border-radius: 4px; padding: 18px 20px; text-align: center; margin: 0 auto 24px auto; max-width: 240px;">
          <span class="otp-code" style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111113; display: inline-block; padding-left: 6px;">${otp}</span>
        </div>
        
        <p style="font-size: 12px; color: #7A7A85; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
          This code is valid for <strong>10 minutes</strong>. If you did not request this verification, please disregard this message.
        </p>
        
        <!-- Footer with Branding & Small Logo -->
        <div style="border-top: 1px solid #EAE6DF; padding-top: 18px; font-size: 11px; color: #8C887B; text-align: center; line-height: 1.6;">
          <a href="${brand.website_url}" target="_blank" style="text-decoration: none; display: inline-block; margin-bottom: 8px;">
            <img src="${logoUrl}" alt="${brand.business_name}" width="28" style="width: 28px; height: auto; display: block; margin: 0 auto; opacity: 0.8; border: 0;" />
          </a>
          <div>&copy; 2026 ${brand.business_name} &bull; ${brand.tagline || "The Indian Corporate Wear"}</div>
          <a href="${brand.website_url}" style="color: #6E6E75; text-decoration: none;">${brand.website_url.replace(/^https?:\/\//, "")}</a> &bull; 
          <a href="mailto:${supportEmail}" style="color: #6E6E75; text-decoration: none;">${supportEmail}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await resendClient.emails.send({
      from: fromEmail,
      to: recipientEmail,
      reply_to: replyTo,
      subject,
      text: textBody,
      html,
      headers: {
        "X-Entity-Ref-ID": `suko-otp-${Date.now()}`
      }
    });

    if (result.error) {
      console.warn("⚠️  [Resend API Warning]:", result.error.message || result.error);
      return {
        success: true,
        delivered: false,
        error: result.error.message || "Resend delivery failed"
      };
    }

    return {
      success: true,
      delivered: true,
      data: result.data
    };
  } catch (err) {
    console.error("❌ [Resend] Failed to send verification email:", err.message);
    return {
      success: true,
      delivered: false,
      error: err.message
    };
  }
}

/**
 * Helper to format numbers into Indian Rupee format (e.g. ₹12,499.00)
 */
function formatINR(amount) {
  const num = Number(amount) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Send Instant Order Confirmation Email to Patron upon checkout
 * @param {Object} order - Order object with items, shipping details, total
 */
async function sendOrderConfirmationEmail(order) {
  if (!order) return { success: false, error: "Order details missing" };

  const brand = await getBrandSettings();
  const recipientEmail = (order.email || order.shipping_email || order.user?.email || "indiancorporatewearbysuko@gmail.com").trim().toLowerCase();
  const recipientName = (order.name || order.shipping_name || order.user?.name || "Valued Patron").trim();
  const orderNumber = `#SUKO-${1000 + (order.id || 0)}`;
  const orderId = order.id || 1;

  const rawItems = Array.isArray(order.items) ? order.items : [];
  const items = rawItems.length > 0 ? rawItems : [
    { product_name: "Bespoke Atelier Garment", size: "Custom", quantity: 1, price: order.total || 4800 }
  ];

  const itemsSummary = items.map(it => `• ${it.product?.name || it.product_name || it.name || "Handcrafted Garment"} (Size: ${it.size || "Standard"}) × ${it.quantity || 1}`).join("\n");

  const message = `Dear ${recipientName},

We are pleased to confirm that your order ${orderNumber} has been successfully received by our master atelier.

ORDER REQUISITION SUMMARY:
${itemsSummary}

Total Amount: ${formatINR(order.total || 0)}
Payment Method: ${(order.payment_method || "UPI").toUpperCase()}
White-Glove Shipping: COMPLIMENTARY

Our artisans are now reviewing your specifications and preparing the archival textiles. You will receive an official tax invoice and white-glove dispatch updates as your garments progress through tailoring.`;

  const result = await sendBroadcastEmail({
    to: recipientEmail,
    subject: `Order Confirmed: ${orderNumber} | ${brand.business_name}`,
    message,
    recipientName,
    ctaText: "View Order Status",
    ctaUrl: `${brand.website_url.replace(/\/+$/, "")}/orders`
  });

  // Log in document history
  await recordOrderDocument({
    orderId,
    documentType: "order_confirmation",
    documentNumber: orderNumber,
    sentToEmail: recipientEmail
  });

  // Dispatch Instant New Order Alert Email to Atelier Admin & Concierge
  const adminEmail = brand.support_email || "indiancorporatewearbysuko@gmail.com";
  sendBroadcastEmail({
    to: adminEmail,
    subject: `🔔 [NEW ORDER] ${orderNumber} from ${recipientName} (${formatINR(order.total || 0)})`,
    message: `Atelier Operations Alert,

A new bespoke order has been placed on the storefront:

Requisition ID: ${orderNumber}
Client: ${recipientName} (${recipientEmail})
Contact: ${order.phone || order.shipping_phone || "On File"}
Destination: ${[order.city || order.shipping_city, order.state || order.shipping_state, order.pincode || order.shipping_pincode].filter(Boolean).join(", ") || "India"}

ITEMS ORDERED:
${itemsSummary}

Total Order Value: ${formatINR(order.total || 0)}
Payment Method: ${(order.payment_method || "UPI QR").toUpperCase()}
Payment Status: ${order.status?.toUpperCase() || "PENDING"}

Open your Studio Dashboard to review specifications and initiate workshop dispatch.`,
    recipientName: "Studio Admin",
    ctaText: "Open Studio Dashboard",
    ctaUrl: `${brand.website_url.replace(/\/+$/, "")}/admin`
  }).catch((err) => {
    console.warn("⚠️  [EmailService] Admin new order notification dispatch failed:", err.message);
  });

  return result;
}

/**
 * Send Luxury Order Invoice Email matching SUKO Atelier Theme with attached PDF
 * @param {Object} order - Order object with items, shipping details, total
 * @param {Object} [recipientOverride] - Optional recipient details
 */
async function sendOrderInvoiceEmail(order, recipientOverride = {}) {
  if (!order) return { success: false, error: "Order details missing" };

  const brand = await getBrandSettings();

  const recipientEmail = (
    recipientOverride.email || 
    order.email || 
    order.shipping_email || 
    order.user?.email || 
    ""
  ).trim().toLowerCase();

  const recipientName = (
    recipientOverride.name || 
    order.name || 
    order.shipping_name || 
    order.user?.name || 
    "Valued Patron"
  ).trim();

  if (!recipientEmail) {
    console.warn("⚠️  [EmailService] Cannot send invoice: missing recipient email.");
    return { success: false, error: "Missing recipient email" };
  }

  const orderId = order.id || `ORD-${Date.now()}`;
  const invoiceNumber = order.invoice_number || (await allocateInvoiceNumber(order.id));
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }) : new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const isPaid = order.status === "paid" || order.status === "completed" || order.payment_method === "online";
  const paymentStatusText = isPaid ? "CONFIRMED & PAID" : (order.status === "payment_pending" ? "PAYMENT PENDING" : "CONFIRMED (COD)");
  const paymentMethodDisplay = order.payment_method === "upi_qr" ? "UPI / Instant Transfer" : (order.payment_method === "cod" ? "Cash on Delivery" : "Online Secured Payment");

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce((acc, it) => acc + ((Number(it.price_at_purchase) || Number(it.price) || 0) * (Number(it.quantity) || 1)), 0) || Number(order.total) || 0;
  const grandTotal = Number(order.total) || subtotal;

  console.log(`\n======================================================`);
  console.log(`🧾  [${brand.business_name.toUpperCase()} INVOICE] #${invoiceNumber}`);
  console.log(`👤  Patron: ${recipientName} <${recipientEmail}>`);
  console.log(`💰  Total: ${formatINR(grandTotal)}`);
  console.log(`======================================================\n`);

  // Generate official PDF Buffer for email attachment
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateDocumentPdf({
      order: { ...order, invoice_number: invoiceNumber },
      type: "invoice"
    });
    console.log(`📎  [EmailService] Generated invoice PDF attachment (${Math.round(pdfBuffer.length / 1024)} KB)`);
  } catch (pdfErr) {
    console.warn("⚠️  [EmailService] PDF generation failed, sending HTML without PDF attachment:", pdfErr.message);
  }

  // Record generation/dispatch history in order_documents table
  await recordOrderDocument({
    orderId: order.id,
    documentType: "invoice",
    documentNumber: invoiceNumber,
    sentToEmail: recipientEmail
  });

  if (!resendClient) {
    return {
      success: true,
      delivered: false,
      devMode: true,
      invoiceNumber,
      message: "Resend API key not configured. Invoice logged to terminal console."
    };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || `${brand.business_name} <noreply@indiancorporatewear.com>`;
  const supportEmail = brand.support_email || process.env.SUPPORT_EMAIL || "indiancorporatewearbysuko@gmail.com";
  const replyTo = process.env.REPLY_TO_EMAIL || supportEmail;
  const subject = `Official Tax Invoice #${invoiceNumber} | ${brand.business_name}`;
  const logoUrl = resolveLogoUrl(brand.logo_url, { absoluteForEmail: true });

  // 1. Plain text multipart version
  const itemsText = items.map((it, idx) => {
    const name = it.product?.name || it.product_name || it.name || "Garment";
    const size = it.size ? ` (Size: ${it.size})` : "";
    const qty = it.quantity || 1;
    const price = formatINR(it.price_at_purchase || it.price || 0);
    return `${idx + 1}. ${name}${size} - Qty: ${qty} @ ${price}`;
  }).join("\n");

  const textBody = `${brand.business_name.toUpperCase()}
${(brand.tagline || "").toUpperCase()}
Official Commercial Tax Invoice

Invoice No: #${invoiceNumber}
Date: ${orderDate}
Status: ${paymentStatusText}
Payment Method: ${paymentMethodDisplay}
${brand.gst_number ? `GSTIN: ${brand.gst_number}\n` : ""}
Patron: ${recipientName}
Delivery Address:
${order.shipping_line1 || order.line1 || "Atelier Delivery Address"}
${order.shipping_city || order.city || ""}, ${order.shipping_state || order.state || ""} ${order.shipping_pincode ? `PIN: ${order.shipping_pincode}` : ""}
Phone: ${order.shipping_phone || order.phone || "Not specified"}

--------------------------------------------------
ORDER SPECIFICATIONS:
--------------------------------------------------
${itemsText}

--------------------------------------------------
PRICING BREAKDOWN:
--------------------------------------------------
Subtotal: ${formatINR(subtotal)}
White-Glove Atelier Delivery: COMPLIMENTARY (₹0.00)
${brand.gst_number ? "Taxes (GST): Inclusive\n" : ""}Grand Total: ${formatINR(grandTotal)}

Thank you for choosing ${brand.business_name}. Your official tax invoice is attached as a PDF for your records.

Concierge Support: ${supportEmail}
Website: ${brand.website_url}`;

  // 2. Luxury HTML version matching SUKO bespoke luxury theme
  const itemsHtml = items.map((it) => {
    const name = it.product?.name || it.product_name || it.name || "Bespoke Atelier Garment";
    const size = it.size ? it.size : "Standard";
    const qty = it.quantity || 1;
    const unitPrice = Number(it.price_at_purchase) || Number(it.price) || 0;
    const itemTotal = unitPrice * qty;

    return `
      <tr style="border-bottom: 1px solid #F3EFE6;">
        <td class="item-desc-cell" style="padding: 13px 8px 13px 0; text-align: left; vertical-align: top; width: 68%;">
          <strong class="item-title" style="color: #111113; font-size: 13.5px; display: block; font-weight: 600; line-height: 1.4;">${name}</strong>
          <div style="margin-top: 5px;">
            <span style="display: inline-block; padding: 1.5px 6px; background-color: #F6F3EB; border: 1px solid #E5E0D5; border-radius: 2px; font-size: 9.5px; font-weight: 600; color: #55555A; text-transform: uppercase; letter-spacing: 0.5px;">Size: ${size}</span>
            <span style="font-size: 11.5px; color: #7A7A85; margin-left: 6px;">Qty: ${qty} &times; ${formatINR(unitPrice)}</span>
          </div>
        </td>
        <td class="item-total-cell" style="padding: 13px 0 13px 8px; text-align: right; vertical-align: top; width: 32%; color: #111113; font-size: 14px; font-weight: 700; white-space: nowrap;">
          ${formatINR(itemTotal)}
        </td>
      </tr>
    `;
  }).join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>${brand.business_name} Invoice #${invoiceNumber}</title>
      <style>
        body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }

        @media only screen and (max-width: 520px) {
          .email-outer-pad { padding: 12px 6px !important; }
          .email-card-box { padding: 22px 16px !important; border-radius: 4px !important; width: 100% !important; box-sizing: border-box !important; }
          .header-logo { font-size: 22px !important; letter-spacing: 0.26em !important; }
          .header-subtitle { font-size: 9.5px !important; }
          .meta-col-left { display: block !important; width: 100% !important; text-align: left !important; }
          .meta-col-right { display: block !important; width: 100% !important; text-align: left !important; margin-top: 14px !important; }
          .shipping-box { padding: 13px 14px !important; }
          .item-desc-cell { width: 62% !important; padding: 12px 6px 12px 0 !important; }
          .item-total-cell { width: 38% !important; padding: 12px 0 12px 6px !important; font-size: 13px !important; }
          .item-title { font-size: 12.5px !important; }
          .total-box-container { padding: 12px 14px !important; }
          .grand-total-val { font-size: 17px !important; }
          .cta-full-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 13px 18px !important; text-align: center !important; }
        }
      </style>
    </head>
    <body class="email-outer-pad" style="margin: 0; padding: 32px 16px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111113; -webkit-font-smoothing: antialiased;">
      <div class="email-card-box" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 6px; padding: 38px 30px; box-shadow: 0 4px 22px rgba(17, 17, 19, 0.04);">
        
        <!-- Header / Atelier Identity -->
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${brand.website_url}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img src="${logoUrl}" alt="${brand.business_name}" width="125" class="header-logo-img" style="width: 125px; max-width: 125px; height: auto; display: block; margin: 0 auto; border: 0; outline: none;" />
          </a>
          <h1 class="header-logo" style="margin: 12px 0 0 0; font-family: 'Times New Roman', Georgia, serif; font-size: 21px; font-weight: 400; letter-spacing: 0.26em; text-transform: uppercase; color: #111113;">${brand.business_name}</h1>
          ${brand.tagline ? `<p class="header-subtitle" style="margin: 4px 0 0 0; font-size: 10px; font-weight: 600; letter-spacing: 0.20em; text-transform: uppercase; color: #8E877E;">${brand.tagline}</p>` : ""}
          <div style="height: 1.5px; width: 44px; background-color: #C2922E; margin: 12px auto 0 auto;"></div>
        </div>

        <div style="height: 1px; background: #EAE6DF; margin-bottom: 24px;"></div>

        <!-- Order Header Badge & Invoice Info -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
          <tr>
            <td class="meta-col-left" style="vertical-align: top;">
              <span style="font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: #7A7A85; display: block; margin-bottom: 3px;">Tax Invoice</span>
              <strong style="font-size: 15px; color: #111113; font-family: 'Courier New', Courier, monospace; letter-spacing: 0.5px;">#${invoiceNumber}</strong>
              <span style="font-size: 11.5px; color: #7A7A85; display: block; margin-top: 2px;">Date: ${orderDate}</span>
              ${brand.gst_number ? `<span style="font-size: 11px; color: #111113; font-weight: 600; display: block; margin-top: 2px;">GSTIN: ${brand.gst_number}</span>` : ""}
            </td>
            <td class="meta-col-right" style="vertical-align: top; text-align: right;">
              <span style="display: inline-block; padding: 4px 10px; background-color: #F8F5EE; border: 1px solid #D8C39D; border-radius: 3px; color: #8A6518; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.10em;">
                ${paymentStatusText}
              </span>
              <span style="font-size: 11px; color: #7A7A85; display: block; margin-top: 4px;">Payment: ${paymentMethodDisplay}</span>
            </td>
          </tr>
        </table>

        <!-- Client & Shipping Destination -->
        <div class="shipping-box" style="background-color: #FAF8F5; border: 1px solid #ECE7DE; border-radius: 4px; padding: 15px 16px; margin-bottom: 24px;">
          <span style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #C2922E; display: block; margin-bottom: 5px;">Delivery Destination</span>
          <strong style="font-size: 13.5px; color: #111113; display: block; font-weight: 600;">${recipientName}</strong>
          <p style="font-size: 12px; line-height: 1.55; color: #5C5C64; margin: 3px 0 0 0;">
            ${order.shipping_line1 || order.line1 || "Atelier Delivery Address"}<br>
            ${order.shipping_city || order.city || ""}, ${order.shipping_state || order.state || ""} ${order.shipping_pincode ? `&bull; PIN: ${order.shipping_pincode}` : ""}<br>
            Contact: ${order.shipping_phone || order.phone || "Not specified"}
          </p>
        </div>

        <!-- Itemized Order Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
          <thead>
            <tr style="border-bottom: 1.5px solid #EAE6DF;">
              <th style="padding: 0 0 9px 0; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.16em; color: #7A7A85; font-weight: 600;">Garment &amp; Specifications</th>
              <th style="padding: 0 0 9px 0; text-align: right; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.16em; color: #7A7A85; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Pricing Summary Calculation -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 26px;">
          <tr>
            <td style="padding: 4px 0; font-size: 12.5px; color: #6E6E75;">Subtotal</td>
            <td style="padding: 4px 0; font-size: 12.5px; color: #111113; text-align: right; font-weight: 500;">${formatINR(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 12.5px; color: #6E6E75;">White-Glove Atelier Shipping</td>
            <td style="padding: 4px 0; font-size: 11px; color: #C2922E; text-align: right; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Complimentary</td>
          </tr>
          ${brand.gst_number ? `
          <tr>
            <td style="padding: 4px 0; font-size: 12.5px; color: #6E6E75;">Taxes &amp; Duties (GST)</td>
            <td style="padding: 4px 0; font-size: 11.5px; color: #6E6E75; text-align: right;">Inclusive</td>
          </tr>
          ` : ""}
          <tr>
            <td colspan="2" style="padding-top: 8px;">
              <div class="total-box-container" style="background-color: #FAF6EE; border: 1.5px solid #C2922E; border-radius: 4px; padding: 13px 15px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 700; color: #111113;">
                      Total Amount
                    </td>
                    <td class="grand-total-val" style="text-align: right; font-size: 18px; font-weight: 700; color: #111113; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      ${formatINR(grandTotal)}
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>

        <!-- PDF Attachment Notification Pill -->
        <div style="background-color: #FAF8F5; border: 1px dashed #C2922E; border-radius: 4px; padding: 12px 14px; text-align: center; margin-bottom: 22px;">
          <span style="font-size: 11px; font-family: monospace; color: #111113; font-weight: 600;">
            📎 Official PDF Invoice Attached (SUKO-Invoice-${invoiceNumber}.pdf)
          </span>
        </div>

        <!-- Concierge & Care Assurance -->
        <div style="border-top: 1px solid #EAE6DF; padding-top: 22px; text-align: center;">
          <span style="font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.20em; color: #C2922E; display: block; margin-bottom: 5px;">Atelier Craftsmanship</span>
          <p style="font-size: 12px; line-height: 1.6; color: #6E6E75; margin: 0 0 16px 0;">
            Every garment is tailored to the highest standards of Indian corporate luxury.
          </p>
          <a class="cta-full-btn" href="${brand.website_url.replace(/\/+$/, "")}/orders" style="display: inline-block; background-color: #111113; color: #FFFFFF; padding: 12px 24px; border-radius: 2px; text-decoration: none; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.20em; font-weight: 600;">
            View Order Status
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #EAE6DF; margin-top: 26px; padding-top: 16px; font-size: 11px; line-height: 1.6; color: #8C887B; text-align: center;">
          <a href="${brand.website_url}" target="_blank" style="text-decoration: none; display: inline-block; margin-bottom: 8px;">
            <img src="${logoUrl}" alt="${brand.business_name}" width="28" style="width: 28px; height: auto; display: block; margin: 0 auto; opacity: 0.8; border: 0;" />
          </a>
          <div>&copy; 2026 ${brand.business_name} &bull; ${brand.tagline || "Indian Corporate Wear"}</div>
          Concierge support: <a href="mailto:${supportEmail}" style="color: #6E6E75; text-decoration: underline;">${supportEmail}</a><br>
          <a href="${brand.website_url}" style="color: #C2922E; text-decoration: none; font-weight: 500;">${brand.website_url.replace(/^https?:\/\//, "")}</a>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    const sendOptions = {
      from: fromEmail,
      to: recipientEmail,
      reply_to: replyTo,
      subject,
      text: textBody,
      html,
      headers: {
        "X-Entity-Ref-ID": `suko-inv-${invoiceNumber}-${Date.now()}`
      }
    };

    // Attach official PDF invoice if generated
    if (pdfBuffer) {
      sendOptions.attachments = [
        {
          filename: `SUKO-Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer
        }
      ];
    }

    const result = await resendClient.emails.send(sendOptions);

    if (result.error) {
      console.warn("⚠️  [Resend Invoice Error]:", result.error.message || result.error);
      return {
        success: false,
        delivered: false,
        error: result.error.message
      };
    }

    console.log(`✅ [EmailService] Invoice successfully sent with PDF attachment to ${recipientEmail} (${invoiceNumber})`);
    return {
      success: true,
      delivered: true,
      invoiceNumber,
      data: result.data
    };
  } catch (err) {
    console.error("❌ [Resend] Failed to send order invoice email:", err.message);
    return {
      success: false,
      delivered: false,
      error: err.message
    };
  }
}

/**
 * Send 6-digit password reset OTP email using Resend
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.otp - 6-digit reset code
 * @param {string} [params.name] - Recipient name
 */
async function sendPasswordResetOtpEmail({ to, otp, name }) {
  const recipientEmail = (to || "").trim().toLowerCase();
  const recipientName = (name || "").trim();

  // Log in terminal for development & debugging
  console.log(`\n======================================================`);
  console.log(`🔑  [SUKO ATELIER EMAIL] Password Reset Request`);
  console.log(`👤  Client: ${recipientName || "Valued Client"} <${recipientEmail}>`);
  console.log(`🔢  RESET CODE: ${otp}`);
  console.log(`⏰  Expires in: 10 minutes`);
  console.log(`======================================================\n`);

  if (!resendClient) {
    return {
      success: true,
      delivered: false,
      devMode: true,
      message: "Resend API key not set. Reset code logged to terminal."
    };
  }

  const brand = await getBrandSettings();
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || `${brand.business_name} <noreply@indiancorporatewear.com>`;
  const supportEmail = brand.support_email || process.env.SUPPORT_EMAIL || "indiancorporatewearbysuko@gmail.com";
  const replyTo = process.env.REPLY_TO_EMAIL || supportEmail;
  const subject = `Your ${brand.business_name} password reset code is ${otp}`;
  const logoUrl = resolveLogoUrl(brand.logo_url, { absoluteForEmail: true });

  const textBody = `Hello${recipientName ? ` ${recipientName}` : ""},

We received a request to reset the password for your ${brand.business_name} account.

Your password reset authorization code is: ${otp}

This code is valid for 10 minutes.

If you did not request a password reset, your credentials remain secure and you can safely disregard this email.

For assistance, reach out to our concierge at ${supportEmail}.

Best regards,
${brand.business_name} Concierge
${brand.tagline || "The Indian Corporate Wear"}
${brand.website_url}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>${brand.business_name} Password Reset</title>
      <style>
        @media only screen and (max-width: 480px) {
          .email-body { padding: 12px 6px !important; }
          .email-card { padding: 26px 18px !important; border-radius: 4px !important; width: 100% !important; box-sizing: border-box !important; }
          .logo-title { font-size: 20px !important; letter-spacing: 0.24em !important; }
          .otp-box { width: 100% !important; max-width: 100% !important; padding: 15px 10px !important; box-sizing: border-box !important; }
          .otp-code { font-size: 27px !important; letter-spacing: 5px !important; }
        }
      </style>
    </head>
    <body class="email-body" style="margin: 0; padding: 32px 16px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111113; -webkit-font-smoothing: antialiased;">
      <div class="email-card" style="max-width: 460px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 6px; padding: 36px 30px; box-shadow: 0 4px 20px rgba(17,17,19,0.03);">
        
        <!-- Atelier Header Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${brand.website_url}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img src="${logoUrl}" alt="${brand.business_name}" width="115" style="width: 115px; max-width: 115px; height: auto; display: block; margin: 0 auto; border: 0;" />
          </a>
          <h1 class="logo-title" style="margin: 10px 0 0 0; font-family: 'Times New Roman', Georgia, serif; font-size: 20px; font-weight: 400; letter-spacing: 0.26em; color: #111113; text-transform: uppercase; padding-left: 0.26em;">${brand.business_name}</h1>
          <p style="margin: 4px 0 0 0; font-size: 9.5px; font-weight: 600; color: #C2922E; letter-spacing: 0.18em; text-transform: uppercase;">${brand.tagline || "The Indian Corporate Wear • Atelier"}</p>
        </div>
        
        <div style="height: 1px; background-color: #EAE6DF; margin-bottom: 24px;"></div>
        
        <div style="display: inline-block; background-color: #F8F5EE; border: 1px solid #E5DECF; border-radius: 3px; padding: 3px 8px; font-size: 9.5px; font-weight: 700; color: #8A6518; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 12px;">
          Security Verification
        </div>

        <p style="font-size: 14.5px; color: #111113; margin: 0 0 12px 0; font-weight: 600;">Hello${recipientName ? ` ${recipientName}` : ""},</p>
        <p style="font-size: 13.5px; line-height: 1.6; color: #5C5C64; margin: 0 0 24px 0;">
          We received a request to reset your ${brand.business_name} account password. Please use the authorization code below to verify your identity and set a new password:
        </p>
        
        <div class="otp-box" style="background-color: #FAF8F5; border: 1.5px dashed #C2922E; border-radius: 4px; padding: 18px 20px; text-align: center; margin: 0 auto 24px auto; max-width: 240px;">
          <span class="otp-code" style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111113; display: inline-block; padding-left: 6px;">${otp}</span>
        </div>
        
        <p style="font-size: 12px; color: #7A7A85; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
          This code is valid for <strong>10 minutes</strong>. If you did not make this request, your account remains secure and you can safely disregard this email.
        </p>
        
        <!-- Footer with Branding & Small Logo -->
        <div style="border-top: 1px solid #EAE6DF; padding-top: 18px; font-size: 11px; color: #8C887B; text-align: center; line-height: 1.6;">
          <a href="${brand.website_url}" target="_blank" style="text-decoration: none; display: inline-block; margin-bottom: 8px;">
            <img src="${logoUrl}" alt="${brand.business_name}" width="28" style="width: 28px; height: auto; display: block; margin: 0 auto; opacity: 0.8; border: 0;" />
          </a>
          <div>&copy; 2026 ${brand.business_name} &bull; ${brand.tagline || "The Indian Corporate Wear"}</div>
          <a href="${brand.website_url}" style="color: #6E6E75; text-decoration: none;">${brand.website_url.replace(/^https?:\/\//, "")}</a> &bull; 
          <a href="mailto:${supportEmail}" style="color: #6E6E75; text-decoration: none;">${supportEmail}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await resendClient.emails.send({
      from: fromEmail,
      to: recipientEmail,
      reply_to: replyTo,
      subject,
      text: textBody,
      html,
      headers: {
        "X-Entity-Ref-ID": `suko-pwd-reset-${Date.now()}`
      }
    });

    if (result.error) {
      console.warn("⚠️  [Resend API Warning]:", result.error.message || result.error);
      return {
        success: true,
        delivered: false,
        error: result.error.message || "Resend delivery failed"
      };
    }

    return {
      success: true,
      delivered: true,
      data: result.data
    };
  } catch (err) {
    console.error("❌ [Resend] Failed to send password reset email:", err.message);
    return {
      success: true,
      delivered: false,
      error: err.message
    };
  }
}

/**
 * Send official customer broadcast / concierge update email using Resend
/**
 * Master Branded SUKO Atelier Luxury HTML Email Template
 * Layout:
 *   [ SUKO / ICW Logo ]
 *   SUKO ATELIER | Contemporary Indian Corporate Wear
 *   [ Gold Accent Line ]
 *   Hi {Customer Name},
 *   {Email Subject}
 *   {Message Body}
 *   [ Optional CTA Button ]
 *   With regards, SUKO Atelier
 *   Website: www.indiancorporatewear.com · Instagram: @icwbysuko
 *   © 2026 SUKO Atelier. All rights reserved.
 */
function renderSukoBrandedEmailHtml({
  recipientName = "Valued Patron",
  subject = "SUKO Atelier Notification",
  preheader = "Contemporary Indian Corporate Wear",
  bodyHtml = "",
  ctaText = "",
  ctaUrl = "",
  footerNote = "",
  brandSettings = null
}) {
  const brand = brandSettings || {
    business_name: "SUKO Atelier",
    tagline: "Contemporary Indian Corporate Wear",
    logo_url: "/logo.png",
    support_email: process.env.SUPPORT_EMAIL || "indiancorporatewearbysuko@gmail.com",
    website_url: "https://www.indiancorporatewear.com",
    instagram_url: "https://www.instagram.com/icwbysuko?igsi=MXR4a2hwdWJmOW9lZw%3D%3D&utm_source=qr",
    instagram_handle: "@icwbysuko"
  };
  const supportEmail = brand.support_email || process.env.SUPPORT_EMAIL || "indiancorporatewearbysuko@gmail.com";
  const logoUrl = resolveLogoUrl(brand.logo_url, { absoluteForEmail: true });

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${subject}</title>
  <style>
    /* Reset & Base Styles */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #FAF8F5; }

    /* Responsive Overrides */
    @media only screen and (max-width: 540px) {
      .email-outer-pad { padding: 16px 8px !important; }
      .email-card-box { padding: 28px 18px !important; width: 100% !important; box-sizing: border-box !important; }
      .logo-img { width: 110px !important; max-width: 110px !important; }
      .brand-title { font-size: 19px !important; letter-spacing: 0.22em !important; }
      .brand-subtitle { font-size: 9.5px !important; letter-spacing: 0.16em !important; }
      .subject-heading { font-size: 17px !important; line-height: 1.35 !important; }
      .content-body { font-size: 13.5px !important; line-height: 1.7 !important; }
      .cta-button { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 14px 18px !important; text-align: center !important; }
      .footer-links { font-size: 10.5px !important; }
    }
  </style>
</head>
<body class="email-outer-pad" style="margin: 0; padding: 36px 16px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111113; -webkit-font-smoothing: antialiased;">
  <!-- Preheader preview text (invisible in body) -->
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #FAF8F5;">
    ${preheader || subject} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="email-card-box" style="max-width: 560px; width: 100%; background-color: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 4px; padding: 42px 36px; box-shadow: 0 4px 20px rgba(17,17,19,0.03);">
          
          <!-- 1. BRAND HEADER: LOGO TOP CENTER -->
          <tr>
            <td align="center" style="text-align: center; padding-bottom: 20px;">
              <a href="${brand.website_url}" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="${logoUrl}" alt="${brand.business_name}" width="125" class="logo-img" style="width: 125px; max-width: 125px; height: auto; display: block; margin: 0 auto; border: 0; outline: none;" />
              </a>
              <div class="brand-title" style="margin-top: 14px; font-family: 'Times New Roman', Georgia, serif; font-size: 21px; font-weight: 400; letter-spacing: 0.26em; color: #111113; text-transform: uppercase;">
                ${brand.business_name}
              </div>
              ${brand.tagline ? `
              <div class="brand-subtitle" style="margin-top: 5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.20em; color: #8E877E; text-transform: uppercase;">
                ${brand.tagline}
              </div>
              ` : ""}
              <!-- Gold Accent Line -->
              <div style="height: 1.5px; width: 48px; background-color: #C2922E; margin: 14px auto 0 auto;"></div>
            </td>
          </tr>

          <!-- Subtle Divider -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="height: 1px; background-color: #EAE6DF; width: 100%;"></div>
            </td>
          </tr>

          <!-- 2. SALUTATION -->
          <tr>
            <td style="padding-bottom: 14px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #111113; font-weight: 600;">
                Hi ${recipientName || "Valued Client"},
              </p>
            </td>
          </tr>

          <!-- 3. EMAIL SUBJECT / HEADLINE -->
          ${subject ? `
          <tr>
            <td style="padding-bottom: 16px;">
              <h2 class="subject-heading" style="margin: 0; font-family: 'Times New Roman', Georgia, serif; font-size: 20px; font-weight: 400; color: #111113; letter-spacing: -0.01em; line-height: 1.35;">
                ${subject}
              </h2>
            </td>
          </tr>
          ` : ""}

          <!-- 4. MESSAGE BODY -->
          <tr>
            <td class="content-body" style="font-size: 14px; line-height: 1.75; color: #2D2A26;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- 5. OPTIONAL CALL TO ACTION BUTTON -->
          ${ctaUrl && ctaText ? `
          <tr>
            <td align="center" style="padding-top: 30px; padding-bottom: 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 2px; background-color: #111113;">
                    <a href="${ctaUrl}" target="_blank" class="cta-button" style="display: inline-block; background-color: #111113; color: #FAF8F5; text-decoration: none; padding: 14px 34px; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; border-radius: 2px; border: 1px solid #C2922E; box-shadow: 0 2px 8px rgba(17,17,19,0.08);">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ""}

          <!-- 6. SIGN-OFF -->
          <tr>
            <td style="padding-top: 28px;">
              <div style="height: 1px; background-color: #EAE6DF; width: 100%; margin-bottom: 20px;"></div>
              <p style="margin: 0; font-size: 13.5px; color: #111113; font-weight: 500;">With regards,</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #111113;">${brand.business_name}</p>
              ${brand.tagline ? `<p style="margin: 2px 0 0 0; font-size: 10.5px; color: #C2922E; font-family: monospace; text-transform: uppercase; letter-spacing: 0.12em;">${brand.tagline}</p>` : ""}
            </td>
          </tr>

          <!-- 7. FOOTER: WEBSITE, INSTAGRAM & COPYRIGHT -->
          <tr>
            <td style="padding-top: 24px;">
              <div style="height: 1px; background-color: #EAE6DF; width: 100%; margin-bottom: 18px;"></div>
              <div class="footer-links" style="text-align: center; font-size: 11px; color: #8E877E; line-height: 1.8;">
                <a href="${brand.website_url}" target="_blank" style="text-decoration: none; display: inline-block; margin-bottom: 10px;">
                  <img src="${logoUrl}" alt="${brand.business_name}" width="32" style="width: 32px; height: auto; display: block; margin: 0 auto; opacity: 0.82; border: 0;" />
                </a>
                <p style="margin: 0;">
                  Website: <a href="${brand.website_url}" target="_blank" style="color: #111113; text-decoration: underline; font-weight: 500;">${brand.website_url.replace(/^https?:\/\//, "")}</a>
                </p>
                <p style="margin: 4px 0 0 0;">
                  Instagram: <a href="${brand.instagram_url}" target="_blank" style="color: #C2922E; text-decoration: underline; font-weight: 500;">${brand.instagram_handle || "@icwbysuko"}</a>
                </p>
                ${footerNote ? `<p style="margin: 6px 0 0 0; font-size: 10.5px; color: #A49E93;">${footerNote}</p>` : ""}
                <p style="margin: 12px 0 0 0; font-size: 10px; color: #A49E93;">
                  &copy; 2026 ${brand.business_name}. All rights reserved.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Replace personalized tags in subject and message
 */
function interpolateDynamicTags(text, { recipientName = "Valued Client", discountCode = "SUKO10", orderNumber = "#SUKO-1001" } = {}) {
  if (!text) return "";
  return text
    .replace(/\{(?:name|customer_name|Customer Name|client_name)\}/gi, recipientName)
    .replace(/\{discount_code\}/gi, discountCode)
    .replace(/\{order_number\}/gi, orderNumber)
    .replace(/\{showroom_url\}/gi, "https://www.indiancorporatewear.com");
}

/**
 * Send official customer broadcast / concierge update email using Resend
 * Fully formatted with the Branded SUKO Atelier Luxury HTML Template
 */
async function sendBroadcastEmail({
  to,
  subject,
  message,
  recipientName = "Valued Client",
  ctaUrl = "https://www.indiancorporatewear.com",
  ctaText = "Explore Collection"
}) {
  const brand = await getBrandSettings();
  const targetEmail = to || "indiancorporatewearbysuko@gmail.com";
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || `${brand.business_name} <noreply@indiancorporatewear.com>`;
  const supportEmail = brand.support_email || process.env.SUPPORT_EMAIL || "indiancorporatewearbysuko@gmail.com";
  const replyTo = process.env.REPLY_TO_EMAIL || supportEmail;

  // Personalize message and subject
  const cleanSubject = interpolateDynamicTags(subject, { recipientName });
  const cleanMessage = interpolateDynamicTags(message, { recipientName });

  console.log(`📨 [EmailService] Preparing customer communication broadcast:`);
  console.log(`   To: ${targetEmail}`);
  console.log(`   Subject: ${cleanSubject}`);
  console.log(`   Recipient Name: ${recipientName}`);

  // Convert plain newlines to styled HTML paragraphs
  const formattedHtmlParagraphs = cleanMessage
    .split(/\n\n+/)
    .map(p => `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.75; color: #2D2A26;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const textBody = `${brand.business_name.toUpperCase()}
${(brand.tagline || "").toUpperCase()}
--------------------------------------------------

Hi ${recipientName},

${cleanSubject}

${cleanMessage}

${ctaUrl && ctaText ? `${ctaText}: ${ctaUrl}\n` : ""}
--------------------------------------------------
With regards,
${brand.business_name}

Website: ${brand.website_url}
Instagram: ${brand.instagram_url} (${brand.instagram_handle || "@icwbysuko"})
© 2026 ${brand.business_name}. All rights reserved.`;

  const html = renderSukoBrandedEmailHtml({
    recipientName,
    subject: cleanSubject,
    bodyHtml: formattedHtmlParagraphs,
    ctaText: ctaText || "",
    ctaUrl: ctaUrl || "",
    brandSettings: brand
  });

  if (!resendClient) {
    console.log(`[EmailService Local Dev Mock] Branded broadcast logged to console:\nTo: ${targetEmail}\nSubject: ${cleanSubject}`);
    return {
      success: true,
      delivered: true,
      mock: true,
      message: "Resend API key not configured. Broadcast logged to terminal."
    };
  }

  try {
    const result = await resendClient.emails.send({
      from: fromEmail,
      to: [targetEmail],
      reply_to: replyTo,
      subject: cleanSubject,
      text: textBody,
      html,
      headers: {
        "X-Entity-Ref-ID": `suko-broadcast-${Date.now()}`
      }
    });

    if (result.error) {
      console.warn("⚠️  [Resend Broadcast Warning]:", result.error.message || result.error);
      return {
        success: true,
        delivered: false,
        error: result.error.message || "Resend broadcast delivery failed"
      };
    }

    return {
      success: true,
      delivered: true,
      data: result.data
    };
  } catch (err) {
    console.error("❌ [Resend] Failed to dispatch broadcast email:", err.message);
    return {
      success: true,
      delivered: false,
      error: err.message
    };
  }
}

/**
 * Send Payment Receipt & Confirmation Email using Branded SUKO Atelier Template
 */
async function sendPaymentReceiptEmail(order) {
  if (!order) return { success: false, error: "Order details missing" };

  const recipientEmail = (order.email || order.user?.email || "indiancorporatewearbysuko@gmail.com").trim().toLowerCase();
  const recipientName = (order.name || order.shipping_name || order.user?.name || "Valued Patron").trim();
  const orderNumber = `#SUKO-${1000 + (order.id || 0)}`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">We are delighted to confirm that your payment for order <strong>${orderNumber}</strong> has been successfully received and verified by our atelier concierge.</p>
    
    <div style="background-color: #FAF8F5; border: 1px solid #EAE6DF; border-radius: 4px; padding: 18px 20px; margin: 20px 0 24px 0;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #8E877E; padding-bottom: 6px;">Order Number</td>
          <td align="right" style="font-size: 13px; font-weight: 600; color: #111113; font-family: monospace; padding-bottom: 6px;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #8E877E; padding-bottom: 6px;">Amount Paid</td>
          <td align="right" style="font-size: 14px; font-weight: 700; color: #111113; padding-bottom: 6px;">${formatINR(order.total || 0)}</td>
        </tr>
        <tr>
          <td style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #8E877E;">Payment Status</td>
          <td align="right">
            <span style="display: inline-block; padding: 2px 8px; background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 2px; font-size: 10px; font-family: monospace; color: #065F46; font-weight: 600; text-transform: uppercase;">
              PAID &amp; SETTLED
            </span>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 16px 0;">Our master tailors are now tailoring and inspecting your silhouettes. You will receive an update the moment your package is ready for white-glove transit.</p>
  `;

  return sendBroadcastEmail({
    to: recipientEmail,
    subject: `Payment Confirmed: Order ${orderNumber} | SUKO Atelier`,
    message: `Payment Confirmed: Order ${orderNumber}\nAmount Paid: ${formatINR(order.total || 0)}\nStatus: Paid & Settled\n\nOur master artisans have received your order details and are preparing your bespoke garments.`,
    recipientName,
    ctaText: "View Order",
    ctaUrl: `https://www.indiancorporatewear.com/account`
  });
}

/**
 * Send Shipping / Atelier Dispatch Update Email using Branded SUKO Atelier Template
 */
async function sendShippingUpdateEmail(order, statusText = "In Transit") {
  if (!order) return { success: false, error: "Order details missing" };

  const recipientEmail = (order.email || order.user?.email || "indiancorporatewearbysuko@gmail.com").trim().toLowerCase();
  const recipientName = (order.name || order.shipping_name || order.user?.name || "Valued Patron").trim();
  const orderNumber = `#SUKO-${1000 + (order.id || 0)}`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">Your handcrafted garments from order <strong>${orderNumber}</strong> have departed our atelier and are en route via our white-glove courier partner.</p>
    
    <div style="background-color: #FAF8F5; border: 1px solid #EAE6DF; border-radius: 4px; padding: 18px 20px; margin: 20px 0 24px 0;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #8E877E; padding-bottom: 6px;">Order Number</td>
          <td align="right" style="font-size: 13px; font-weight: 600; color: #111113; font-family: monospace; padding-bottom: 6px;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #8E877E; padding-bottom: 6px;">Transit Status</td>
          <td align="right">
            <span style="display: inline-block; padding: 2px 8px; background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 2px; font-size: 10px; font-family: monospace; color: #92400E; font-weight: 600; text-transform: uppercase;">
              ${statusText}
            </span>
          </td>
        </tr>
        <tr>
          <td style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #8E877E;">Destination</td>
          <td align="right" style="font-size: 12px; color: #111113; font-weight: 500;">
            ${order.shipping_city || order.city || "Client Address"}, ${order.shipping_state || order.state || "India"}
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 16px 0;">Every silhouette has been hand-pressed, inspected, and encased in our signature monogram dust bag for supreme presentation.</p>
  `;

  return sendBroadcastEmail({
    to: recipientEmail,
    subject: `Atelier Dispatch: Your SUKO Silhouettes Are In Transit (${orderNumber})`,
    message: `Your handcrafted order ${orderNumber} has departed our atelier and is currently en route to you.\nStatus: ${statusText}\n\nEvery silhouette has been carefully pressed, inspected, and encased in our signature dust bag.`,
    recipientName,
    ctaText: "Track Order",
    ctaUrl: `https://www.indiancorporatewear.com/account`
  });
}

module.exports = {
  renderSukoBrandedEmailHtml,
  sendVerificationOtpEmail,
  sendOrderConfirmationEmail,
  sendOrderInvoiceEmail,
  sendPasswordResetOtpEmail,
  sendBroadcastEmail,
  sendPaymentReceiptEmail,
  sendShippingUpdateEmail
};

