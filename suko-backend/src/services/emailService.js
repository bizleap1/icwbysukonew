const { Resend } = require("resend");

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

  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "SUKO Atelier <noreply@indiancorporatewear.com>";
  const supportEmail = process.env.SUPPORT_EMAIL || "indiancorporatewearbysuko@gmail.com";
  const replyTo = process.env.REPLY_TO_EMAIL || supportEmail;
  const subject = `Your SUKO Atelier verification code is ${otp}`;

  const textBody = `Hello${recipientName ? ` ${recipientName}` : ""},

Your SUKO Atelier account verification code is: ${otp}

This code is valid for 10 minutes.

If you did not request this verification code, you can safely disregard this email.

Best regards,
SUKO Atelier Team
The Indian Corporate Wear
https://www.indiancorporatewear.com
${supportEmail}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>SUKO Atelier Verification</title>
      <style>
        @media only screen and (max-width: 480px) {
          .email-body { padding: 12px 6px !important; }
          .email-card { padding: 26px 18px !important; border-radius: 4px !important; width: 100% !important; box-sizing: border-box !important; }
          .logo-title { font-size: 21px !important; letter-spacing: 0.28em !important; }
          .otp-box { width: 100% !important; max-width: 100% !important; padding: 15px 10px !important; box-sizing: border-box !important; }
          .otp-code { font-size: 27px !important; letter-spacing: 5px !important; }
        }
      </style>
    </head>
    <body class="email-body" style="margin: 0; padding: 32px 16px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111113; -webkit-font-smoothing: antialiased;">
      <div class="email-card" style="max-width: 460px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 6px; padding: 36px 30px; box-shadow: 0 4px 20px rgba(17,17,19,0.03);">
        
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 class="logo-title" style="margin: 0; font-size: 23px; font-weight: 400; letter-spacing: 0.30em; color: #111113; text-transform: uppercase; padding-left: 0.30em;">S U K O</h1>
          <p style="margin: 5px 0 0 0; font-size: 10px; font-weight: 600; color: #C2922E; letter-spacing: 0.20em; text-transform: uppercase;">The Indian Corporate Wear &bull; Atelier</p>
        </div>
        
        <div style="height: 1px; background-color: #EAE6DF; margin-bottom: 24px;"></div>
        
        <p style="font-size: 14.5px; color: #111113; margin: 0 0 12px 0; font-weight: 600;">Hello${recipientName ? ` ${recipientName}` : ""},</p>
        <p style="font-size: 13.5px; line-height: 1.6; color: #5C5C64; margin: 0 0 24px 0;">
          Welcome to SUKO. Please use the authorization code below to verify your email address and activate your atelier account:
        </p>
        
        <div class="otp-box" style="background-color: #FAF8F5; border: 1.5px dashed #C2922E; border-radius: 4px; padding: 18px 20px; text-align: center; margin: 0 auto 24px auto; max-width: 240px;">
          <span class="otp-code" style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111113; display: inline-block; padding-left: 6px;">${otp}</span>
        </div>
        
        <p style="font-size: 12px; color: #7A7A85; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
          This code is valid for <strong>10 minutes</strong>. If you did not request this verification, please disregard this message.
        </p>
        
        <div style="border-top: 1px solid #EAE6DF; padding-top: 20px; font-size: 11px; color: #8C887B; text-align: center; line-height: 1.6;">
          &copy; 2026 SUKO Atelier &bull; The Indian Corporate Wear<br/>
          <a href="https://www.indiancorporatewear.com" style="color: #6E6E75; text-decoration: none;">www.indiancorporatewear.com</a> &bull; 
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
 * Send Luxury Order Invoice Email matching SUKO Atelier Theme
 * @param {Object} order - Order object with items, shipping details, total
 * @param {Object} [recipientOverride] - Optional recipient details
 */
async function sendOrderInvoiceEmail(order, recipientOverride = {}) {
  if (!order) return { success: false, error: "Order details missing" };

  const recipientEmail = (
    recipientOverride.email || 
    order.email || 
    order.user?.email || 
    ""
  ).trim().toLowerCase();

  const recipientName = (
    recipientOverride.name || 
    order.name || 
    order.shipping_name || 
    order.user?.name || 
    "Valued Client"
  ).trim();

  if (!recipientEmail) {
    console.warn("⚠️  [EmailService] Cannot send invoice: missing recipient email.");
    return { success: false, error: "Missing recipient email" };
  }

  const orderId = order.id || `ORD-${Date.now()}`;
  const invoiceNumber = `INV-SUKO-${orderId}`;
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }) : new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const isPaid = order.status === "paid" || order.payment_method === "online";
  const paymentStatusText = isPaid ? "CONFIRMED & PAID" : (order.status === "payment_pending" ? "PAYMENT PENDING" : "CONFIRMED (COD)");
  const paymentMethodDisplay = order.payment_method === "upi_qr" ? "UPI / Instant Transfer" : (order.payment_method === "cod" ? "Cash on Delivery" : "Online Secured Payment");

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce((acc, it) => acc + ((Number(it.price_at_purchase) || Number(it.price) || 0) * (Number(it.quantity) || 1)), 0) || Number(order.total) || 0;
  const grandTotal = Number(order.total) || subtotal;

  console.log(`\n======================================================`);
  console.log(`🧾  [SUKO ATELIER INVOICE] Order #${orderId}`);
  console.log(`👤  Client: ${recipientName} <${recipientEmail}>`);
  console.log(`💰  Total: ${formatINR(grandTotal)}`);
  console.log(`======================================================\n`);

  if (!resendClient) {
    return {
      success: true,
      delivered: false,
      devMode: true,
      message: "Resend API key not configured. Invoice logged to terminal console."
    };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "SUKO Atelier <noreply@indiancorporatewear.com>";
  const supportEmail = process.env.SUPPORT_EMAIL || "indiancorporatewearbysuko@gmail.com";
  const replyTo = process.env.REPLY_TO_EMAIL || supportEmail;
  const subject = `Order Confirmed & Invoice - #${invoiceNumber} | SUKO Atelier`;

  // 1. Plain text multipart version (for deliverability & screen readers)
  const itemsText = items.map((it, idx) => {
    const name = it.product?.name || it.product_name || it.name || "Garment";
    const size = it.size ? ` (Size: ${it.size})` : "";
    const qty = it.quantity || 1;
    const price = formatINR(it.price_at_purchase || it.price || 0);
    return `${idx + 1}. ${name}${size} - Qty: ${qty} @ ${price}`;
  }).join("\n");

  const textBody = `S U K O  A T E L I E R
THE INDIAN CORPORATE WEAR
Order Confirmation & Official Invoice

Invoice: #${invoiceNumber}
Date: ${orderDate}
Status: ${paymentStatusText}
Payment Method: ${paymentMethodDisplay}

Client: ${recipientName}
Delivery Address:
${order.shipping_line1 || order.line1 || ""}
${order.shipping_city || order.city || ""}, ${order.shipping_state || order.state || ""} - ${order.shipping_pincode || order.pincode || ""}
Phone: ${order.shipping_phone || order.phone || ""}

--------------------------------------------------
ORDER ITEMS:
--------------------------------------------------
${itemsText || "Bespoke Order Items"}

--------------------------------------------------
PRICING BREAKDOWN:
--------------------------------------------------
Subtotal: ${formatINR(subtotal)}
Atelier Delivery: COMPLIMENTARY (₹0.00)
Taxes (GST): Included
Grand Total: ${formatINR(grandTotal)}

Thank you for choosing SUKO Atelier. Your handcrafted corporate attire is being prepared with exquisite care.

For bespoke assistance or queries:
${supportEmail}
https://www.indiancorporatewear.com`;

  // 2. Luxury HTML version matching SUKO bespoke luxury theme (Mobile Responsive)
  const itemsHtml = items.map((it) => {
    const name = it.product?.name || it.product_name || it.name || "Bespoke Atelier Garment";
    const size = it.size ? it.size : "Custom";
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
      <title>SUKO Atelier Invoice #${invoiceNumber}</title>
      <style>
        /* Mobile & Responsive Resets */
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
        <div style="text-align: center; margin-bottom: 26px;">
          <h1 class="header-logo" style="margin: 0; font-size: 24px; font-weight: 400; letter-spacing: 0.30em; text-transform: uppercase; color: #111113; padding-left: 0.30em;">S U K O</h1>
          <p class="header-subtitle" style="margin: 5px 0 0 0; font-size: 10px; font-weight: 600; letter-spacing: 0.20em; text-transform: uppercase; color: #C2922E;">The Indian Corporate Wear &bull; Atelier</p>
        </div>

        <div style="height: 1px; background: #EAE6DF; margin-bottom: 24px;"></div>

        <!-- Order Header Badge & Invoice Info (Responsive Stack on Mobile) -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
          <tr>
            <td class="meta-col-left" style="vertical-align: top;">
              <span style="font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: #7A7A85; display: block; margin-bottom: 3px;">Tax Invoice</span>
              <strong style="font-size: 15px; color: #111113; font-family: 'Courier New', Courier, monospace; letter-spacing: 0.5px;">#${invoiceNumber}</strong>
              <span style="font-size: 11.5px; color: #7A7A85; display: block; margin-top: 2px;">Date: ${orderDate}</span>
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
            ${order.shipping_city || order.city || ""}, ${order.shipping_state || order.state || ""} ${order.shipping_pincode ? `&bull; ${order.shipping_pincode}` : ""}<br>
            Contact: ${order.shipping_phone || order.phone || "Not specified"}
          </p>
        </div>

        <!-- Itemized Order Table (Mobile Editorial Hybrid Format) -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
          <thead>
            <tr style="border-bottom: 1.5px solid #EAE6DF;">
              <th style="padding: 0 0 9px 0; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.16em; color: #7A7A85; font-weight: 600;">Garment &amp; Specifications</th>
              <th style="padding: 0 0 9px 0; text-align: right; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.16em; color: #7A7A85; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || `
              <tr>
                <td colspan="2" style="padding: 16px 0; text-align: center; color: #7A7A85; font-size: 12.5px;">
                  Custom Bespoke Garment Order
                </td>
              </tr>
            `}
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
          <tr>
            <td style="padding: 4px 0; font-size: 12.5px; color: #6E6E75;">Taxes &amp; Duties (GST)</td>
            <td style="padding: 4px 0; font-size: 11.5px; color: #6E6E75; text-align: right;">Inclusive</td>
          </tr>
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

        <!-- Concierge & Care Assurance -->
        <div style="border-top: 1px solid #EAE6DF; padding-top: 22px; text-align: center;">
          <span style="font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.20em; color: #C2922E; display: block; margin-bottom: 5px;">Atelier Craftsmanship</span>
          <p style="font-size: 12px; line-height: 1.6; color: #6E6E75; margin: 0 0 16px 0;">
            Every garment is tailored to the highest standards of Indian corporate luxury. You will receive real-time tracking as your order departs our workshop.
          </p>
          <a class="cta-full-btn" href="https://www.indiancorporatewear.com/orders" style="display: inline-block; background-color: #111113; color: #FFFFFF; padding: 12px 24px; border-radius: 2px; text-decoration: none; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.20em; font-weight: 600;">
            View Order Status
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #EAE6DF; margin-top: 26px; padding-top: 16px; font-size: 11px; line-height: 1.6; color: #8C887B; text-align: center;">
          &copy; 2026 SUKO Atelier &bull; Indian Corporate Wear<br>
          Concierge support: <a href="mailto:${supportEmail}" style="color: #6E6E75; text-decoration: underline;">${supportEmail}</a><br>
          <a href="https://www.indiancorporatewear.com" style="color: #C2922E; text-decoration: none; font-weight: 500;">www.indiancorporatewear.com</a>
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
        "X-Entity-Ref-ID": `suko-inv-${orderId}-${Date.now()}`
      }
    });

    if (result.error) {
      console.warn("⚠️  [Resend Invoice Error]:", result.error.message || result.error);
      return {
        success: false,
        delivered: false,
        error: result.error.message
      };
    }

    console.log(`✅ [EmailService] Invoice successfully sent to ${recipientEmail} for Order #${orderId}`);
    return {
      success: true,
      delivered: true,
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

  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "SUKO Atelier <noreply@indiancorporatewear.com>";
  const supportEmail = process.env.SUPPORT_EMAIL || "indiancorporatewearbysuko@gmail.com";
  const replyTo = process.env.REPLY_TO_EMAIL || supportEmail;
  const subject = `Your SUKO Atelier password reset code is ${otp}`;

  const textBody = `Hello${recipientName ? ` ${recipientName}` : ""},

We received a request to reset the password for your SUKO Atelier account.

Your password reset authorization code is: ${otp}

This code is valid for 10 minutes.

If you did not request a password reset, your credentials remain secure and you can safely disregard this email.

For assistance, reach out to our concierge at ${supportEmail}.

Best regards,
SUKO Atelier Team
The Indian Corporate Wear
https://www.indiancorporatewear.com`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>SUKO Atelier Password Reset</title>
      <style>
        @media only screen and (max-width: 480px) {
          .email-body { padding: 12px 6px !important; }
          .email-card { padding: 26px 18px !important; border-radius: 4px !important; width: 100% !important; box-sizing: border-box !important; }
          .logo-title { font-size: 21px !important; letter-spacing: 0.28em !important; }
          .otp-box { width: 100% !important; max-width: 100% !important; padding: 15px 10px !important; box-sizing: border-box !important; }
          .otp-code { font-size: 27px !important; letter-spacing: 5px !important; }
        }
      </style>
    </head>
    <body class="email-body" style="margin: 0; padding: 32px 16px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111113; -webkit-font-smoothing: antialiased;">
      <div class="email-card" style="max-width: 460px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 6px; padding: 36px 30px; box-shadow: 0 4px 20px rgba(17,17,19,0.03);">
        
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 class="logo-title" style="margin: 0; font-size: 23px; font-weight: 400; letter-spacing: 0.30em; color: #111113; text-transform: uppercase; padding-left: 0.30em;">S U K O</h1>
          <p style="margin: 5px 0 0 0; font-size: 10px; font-weight: 600; color: #C2922E; letter-spacing: 0.20em; text-transform: uppercase;">The Indian Corporate Wear &bull; Atelier</p>
        </div>
        
        <div style="height: 1px; background-color: #EAE6DF; margin-bottom: 24px;"></div>
        
        <div style="display: inline-block; background-color: #F8F5EE; border: 1px solid #E5DECF; border-radius: 3px; padding: 3px 8px; font-size: 9.5px; font-weight: 700; color: #8A6518; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 12px;">
          Security Verification
        </div>

        <p style="font-size: 14.5px; color: #111113; margin: 0 0 12px 0; font-weight: 600;">Hello${recipientName ? ` ${recipientName}` : ""},</p>
        <p style="font-size: 13.5px; line-height: 1.6; color: #5C5C64; margin: 0 0 24px 0;">
          We received a request to reset your SUKO Atelier account password. Please use the authorization code below to verify your identity and set a new password:
        </p>
        
        <div class="otp-box" style="background-color: #FAF8F5; border: 1.5px dashed #C2922E; border-radius: 4px; padding: 18px 20px; text-align: center; margin: 0 auto 24px auto; max-width: 240px;">
          <span class="otp-code" style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111113; display: inline-block; padding-left: 6px;">${otp}</span>
        </div>
        
        <p style="font-size: 12px; color: #7A7A85; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
          This code is valid for <strong>10 minutes</strong>. If you did not make this request, your account remains secure and you can safely disregard this email.
        </p>
        
        <div style="border-top: 1px solid #EAE6DF; padding-top: 20px; font-size: 11px; color: #8C887B; text-align: center; line-height: 1.6;">
          &copy; 2026 SUKO Atelier &bull; The Indian Corporate Wear<br/>
          <a href="https://www.indiancorporatewear.com" style="color: #6E6E75; text-decoration: none;">www.indiancorporatewear.com</a> &bull; 
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

module.exports = {
  sendVerificationOtpEmail,
  sendOrderInvoiceEmail,
  sendPasswordResetOtpEmail
};

