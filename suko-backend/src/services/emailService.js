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
  const replyTo = process.env.REPLY_TO_EMAIL || "support@indiancorporatewear.com";
  const subject = `Your SUKO Atelier verification code is ${otp}`;

  const textBody = `Hello${recipientName ? ` ${recipientName}` : ""},

Your SUKO Atelier account verification code is: ${otp}

This code is valid for 10 minutes.

If you did not request this verification code, you can safely disregard this email.

Best regards,
SUKO Atelier Team
The Indian Corporate Wear
https://www.indiancorporatewear.com
support@indiancorporatewear.com`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SUKO Atelier Verification</title>
    </head>
    <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 36px 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 2.5px; color: #0f172a; text-transform: uppercase;">SUKO ATELIER</h1>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; letter-spacing: 1.2px; text-transform: uppercase;">The Indian Corporate Wear</p>
        </div>
        
        <div style="border-top: 1px solid #f1f5f9; margin-bottom: 24px;"></div>
        
        <p style="font-size: 15px; color: #334155; margin: 0 0 14px 0; font-weight: 500;">Hello${recipientName ? ` ${recipientName}` : ""},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
          Thank you for choosing SUKO. Please enter the verification code below to verify your email address and activate your atelier account:
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 18px 20px; text-align: center; margin: 0 auto 24px auto; max-width: 240px;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f172a; display: inline-block; padding-left: 6px;">${otp}</span>
        </div>
        
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
          This code is valid for <strong>10 minutes</strong>. If you did not request this, please disregard this email.
        </p>
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.6;">
          &copy; 2026 SUKO Atelier &bull; The Indian Corporate Wear<br/>
          <a href="https://www.indiancorporatewear.com" style="color: #64748b; text-decoration: none;">www.indiancorporatewear.com</a> &bull; 
          <a href="mailto:support@indiancorporatewear.com" style="color: #64748b; text-decoration: none;">support@indiancorporatewear.com</a>
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
  const replyTo = process.env.REPLY_TO_EMAIL || "support@indiancorporatewear.com";
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
support@indiancorporatewear.com
https://www.indiancorporatewear.com`;

  // 2. Luxury HTML version matching SUKO bespoke luxury theme
  const itemsHtml = items.map((it) => {
    const name = it.product?.name || it.product_name || it.name || "Bespoke Atelier Garment";
    const size = it.size ? it.size : "Custom";
    const qty = it.quantity || 1;
    const unitPrice = Number(it.price_at_purchase) || Number(it.price) || 0;
    const itemTotal = unitPrice * qty;

    return `
      <tr style="border-bottom: 1px solid #F3EFE6;">
        <td style="padding: 14px 12px 14px 0; text-align: left; vertical-align: top;">
          <strong style="color: #111113; font-size: 13.5px; display: block; font-weight: 600;">${name}</strong>
          <span style="display: inline-block; margin-top: 4px; padding: 2px 7px; background-color: #F6F3EB; border: 1px solid #E5E0D5; border-radius: 2px; font-size: 10px; font-weight: 600; color: #55555A; text-transform: uppercase; letter-spacing: 0.8px;">Size: ${size}</span>
        </td>
        <td style="padding: 14px 8px; text-align: center; vertical-align: top; color: #6E6E75; font-size: 13px;">
          ${qty}
        </td>
        <td style="padding: 14px 8px; text-align: right; vertical-align: top; color: #6E6E75; font-size: 13px;">
          ${formatINR(unitPrice)}
        </td>
        <td style="padding: 14px 0 14px 8px; text-align: right; vertical-align: top; color: #111113; font-size: 13.5px; font-weight: 600;">
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
      <title>SUKO Atelier Invoice #${invoiceNumber}</title>
    </head>
    <body style="margin: 0; padding: 32px 16px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111113; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 6px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(17, 17, 19, 0.04);">
        
        <!-- Header / Atelier Identity -->
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="margin: 0; font-size: 25px; font-weight: 400; letter-spacing: 0.32em; text-transform: uppercase; color: #111113; padding-left: 0.32em;">S U K O</h1>
          <p style="margin: 6px 0 0 0; font-size: 10.5px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #C2922E;">The Indian Corporate Wear &bull; Atelier</p>
        </div>

        <div style="height: 1px; background: #EAE6DF; margin-bottom: 28px;"></div>

        <!-- Order Header Badge & Invoice Info -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="vertical-align: top;">
              <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: #7A7A85; display: block; margin-bottom: 3px;">Invoice Number</span>
              <strong style="font-size: 16px; color: #111113; font-family: 'Courier New', Courier, monospace; letter-spacing: 0.5px;">#${invoiceNumber}</strong>
              <span style="font-size: 12px; color: #7A7A85; display: block; margin-top: 2px;">Date: ${orderDate}</span>
            </td>
            <td style="vertical-align: top; text-align: right;">
              <span style="display: inline-block; padding: 5px 12px; background-color: #F8F5EE; border: 1px solid #D8C39D; border-radius: 3px; color: #8A6518; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;">
                ${paymentStatusText}
              </span>
              <span style="font-size: 11px; color: #7A7A85; display: block; margin-top: 5px;">Payment: ${paymentMethodDisplay}</span>
            </td>
          </tr>
        </table>

        <!-- Client & Shipping Destination -->
        <div style="background-color: #FAF8F5; border: 1px solid #ECE7DE; border-radius: 4px; padding: 16px 18px; margin-bottom: 28px;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #C2922E; display: block; margin-bottom: 6px;">Delivery Destination</span>
          <strong style="font-size: 13.5px; color: #111113; display: block; font-weight: 600;">${recipientName}</strong>
          <p style="font-size: 12.5px; line-height: 1.5; color: #5C5C64; margin: 3px 0 0 0;">
            ${order.shipping_line1 || order.line1 || "Atelier Delivery Address"}<br>
            ${order.shipping_city || order.city || ""}, ${order.shipping_state || order.state || ""} ${order.shipping_pincode ? `&bull; ${order.shipping_pincode}` : ""}<br>
            Contact: ${order.shipping_phone || order.phone || "Not specified"}
          </p>
        </div>

        <!-- Itemized Order Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="border-bottom: 1.5px solid #EAE6DF;">
              <th style="padding: 0 12px 10px 0; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: #7A7A85; font-weight: 600;">Item &amp; Description</th>
              <th style="padding: 0 8px 10px 8px; text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: #7A7A85; font-weight: 600;">Qty</th>
              <th style="padding: 0 8px 10px 8px; text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: #7A7A85; font-weight: 600;">Rate</th>
              <th style="padding: 0 0 10px 8px; text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: #7A7A85; font-weight: 600;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || `
              <tr>
                <td colspan="4" style="padding: 16px 0; text-align: center; color: #7A7A85; font-size: 13px;">
                  Custom Tailored Apparel Order
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- Pricing Summary Calculation -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr>
            <td style="padding: 5px 0; font-size: 12.5px; color: #6E6E75;">Subtotal</td>
            <td style="padding: 5px 0; font-size: 12.5px; color: #111113; text-align: right; font-weight: 500;">${formatINR(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 12.5px; color: #6E6E75;">White-Glove Atelier Shipping</td>
            <td style="padding: 5px 0; font-size: 11.5px; color: #C2922E; text-align: right; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Complimentary</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 12.5px; color: #6E6E75;">Taxes &amp; Duties (GST)</td>
            <td style="padding: 5px 0; font-size: 12px; color: #6E6E75; text-align: right;">Inclusive</td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 10px;">
              <div style="background-color: #FAF6EE; border: 1.5px solid #C2922E; border-radius: 4px; padding: 14px 16px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 700; color: #111113;">
                      Total Amount
                    </td>
                    <td style="text-align: right; font-size: 19px; font-weight: 700; color: #111113; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      ${formatINR(grandTotal)}
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>

        <!-- Concierge & Care Assurance -->
        <div style="border-top: 1px solid #EAE6DF; padding-top: 24px; text-align: center;">
          <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.20em; color: #C2922E; display: block; margin-bottom: 6px;">Atelier Craftsmanship</span>
          <p style="font-size: 12px; line-height: 1.6; color: #6E6E75; margin: 0 0 16px 0;">
            Every piece is curated to the highest standards of corporate luxury. You will receive a tracking link as soon as your garment departs our atelier.
          </p>
          <a href="https://www.indiancorporatewear.com/orders" style="display: inline-block; background-color: #111113; color: #FFFFFF; padding: 12px 24px; border-radius: 2px; text-decoration: none; font-size: 11px; text-transform: uppercase; letter-spacing: 0.20em; font-weight: 600;">
            View Order Status
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #EAE6DF; margin-top: 28px; padding-top: 18px; font-size: 11px; line-height: 1.6; color: #8C887B; text-align: center;">
          &copy; 2026 SUKO Atelier &bull; Indian Corporate Wear<br>
          For bespoke tailoring inquiries or support, contact our concierge at <a href="mailto:support@indiancorporatewear.com" style="color: #6E6E75; text-decoration: underline;">support@indiancorporatewear.com</a><br>
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

module.exports = {
  sendVerificationOtpEmail,
  sendOrderInvoiceEmail
};

