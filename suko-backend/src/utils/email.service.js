const { Resend } = require('resend');
const { generateInvoicePDF } = require('./pdfGenerator');

// Initialize Resend Client with API Key
const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'ICW by Suko <noreply@indiancorporatewear.com>';

console.log(`📧 Email Provider: Resend HTTPS API (Sender: "${SENDER_EMAIL}")`);

// Helper wrapper for universal responsive email container
function wrapResponsiveEmail(contentHtml) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>SUKO Atelier</title>
  <style>
    * { box-sizing: border-box; }
    body, html { margin: 0; padding: 0; width: 100% !important; background-color: #FAF8F5; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .outer-wrapper { padding: 15px 8px !important; }
      .card-body { padding: 24px 16px !important; border-radius: 8px !important; }
      .otp-display { font-size: 26px !important; letter-spacing: 0.15em !important; padding: 14px 10px !important; }
      .brand-title { font-size: 22px !important; }
      .responsive-table { width: 100% !important; }
      .mobile-stack { display: block !important; width: 100% !important; text-align: left !important; padding-bottom: 8px !important; }
      .mobile-right { text-align: left !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #121215;">
  <div class="outer-wrapper" style="background-color: #FAF8F5; padding: 30px 15px; width: 100%; box-sizing: border-box;">
    ${contentHtml}
  </div>
</body>
</html>`;
}

// Universal send function via Resend HTTPS REST API (Port 443)
async function sendEmail({ to, subject, html, attachments }) {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured in backend environment.');
  }

  const recipientList = Array.isArray(to) ? to : [to];

  const payload = {
    from: SENDER_EMAIL,
    to: recipientList,
    subject,
    html,
  };

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments.map(a => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content),
    }));
  }

  try {
    console.log(`📧 Sending email via Resend API to: ${recipientList.join(', ')}`);
    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error(`❌ Resend API returned error for ${recipientList.join(', ')}:`, error);
      throw new Error(error.message || 'Resend email dispatch error');
    }

    console.log(`✅ Resend email delivered successfully to ${recipientList.join(', ')}. ID:`, data?.id);
    return data;
  } catch (err) {
    console.error(`❌ Resend email dispatch exception for ${recipientList.join(', ')}:`, err.message);
    throw err;
  }
}

// 1. Send Login Notification Email
async function sendLoginNotificationEmail(toEmail, userName) {
  try {
    const content = `
      <div class="card-body" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8E4DC; padding: 35px 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); box-sizing: border-box;">
        <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: #C2922E; font-weight: bold; margin: 0 0 10px 0;">— SECURITY NOTICE</p>
        <h2 class="brand-title" style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: normal; margin: 0 0 16px 0; color: #121215; word-break: break-word;">Hello ${userName || 'Valued Client'},</h2>
        <p style="color: #555560; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">You have successfully signed in to your <strong>SUKO Atelier</strong> account.</p>
        
        <div style="background-color: #FAF8F5; border-left: 3px solid #C2922E; border: 1px solid #E8E4DC; border-left-width: 3px; padding: 14px; margin: 20px 0; border-radius: 6px; box-sizing: border-box;">
          <p style="margin: 0; font-size: 12px; color: #121215;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN')}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #121215;"><strong>Status:</strong> Authenticated Active Session</p>
        </div>

        <p style="color: #888890; font-size: 12px; line-height: 1.5; margin: 15px 0;">If this wasn't you, please reset your password immediately or contact our concierge support team.</p>
        <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 25px 0 20px 0;" />
        <p style="font-size: 10px; color: #888890; text-transform: uppercase; letter-spacing: 0.2em; text-align: center; margin: 0;">SUKO Atelier · Crafted For Distinction</p>
      </div>
    `;

    await sendEmail({
      to: toEmail,
      subject: 'Security Notice: Sign In to your Suko Account',
      html: wrapResponsiveEmail(content),
    });
    console.log('✉️ Login Notification Email sent to:', toEmail);
  } catch (err) {
    console.error('Failed to send login email:', err.message);
  }
}

// 2. Send Order Confirmation Email with PDF Tax Invoice Attachment
async function sendOrderConfirmationEmail(toEmail, order) {
  try {
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateInvoicePDF(order, toEmail);
    } catch (pdfErr) {
      console.error('PDF Generation warning:', pdfErr.message);
    }

    const itemsHtml = (order.items || [])
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8E4DC; vertical-align: top; word-break: break-word;">
          <p style="font-size: 13px; font-weight: bold; color: #121215; margin: 0 0 3px 0;">${item.product?.name || 'Garment Item'}</p>
          <p style="font-size: 11px; color: #888890; margin: 0;">Size: ${item.size || 'STD'}</p>
        </td>
        <td style="padding: 12px 5px; border-bottom: 1px solid #E8E4DC; text-align: center; font-family: monospace; font-size: 13px; color: #121215; vertical-align: top;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8E4DC; text-align: right; font-family: monospace; font-size: 13px; font-weight: bold; color: #121215; vertical-align: top; white-space: nowrap;">
          ₹${Number(item.price_at_purchase || item.product?.price || 0).toLocaleString('en-IN')}
        </td>
      </tr>
    `
      )
      .join('');

    const attachments = pdfBuffer ? [{
      filename: `Invoice_SUKO_${1000 + order.id}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }] : [];

    const content = `
      <div class="card-body" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8E4DC; padding: 35px 25px; box-shadow: 0 4px 25px rgba(0,0,0,0.03); border-radius: 12px; box-sizing: border-box;">
        
        <!-- BRAND HEADER -->
        <div style="margin-bottom: 20px;">
          <h1 class="brand-title" style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: normal; letter-spacing: 0.08em; color: #121215; margin: 0 0 4px 0;">SUKO ATELIER</h1>
          <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #C2922E; font-weight: bold; margin: 0;">OFFICIAL TAX INVOICE & ORDER CONFIRMATION</p>
        </div>

        <div style="border-bottom: 1px solid #E8E4DC; margin-bottom: 20px;"></div>

        <!-- METADATA GRID -->
        <table class="responsive-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <tr>
            <td class="mobile-stack" style="width: 50%; vertical-align: top; padding-bottom: 10px;">
              <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #888890; margin: 0 0 3px 0;">INVOICE NO:</p>
              <p style="font-family: monospace; font-size: 14px; font-weight: bold; color: #121215; margin: 0;">INV-SUKO-${1000 + order.id}</p>
            </td>
            <td class="mobile-stack mobile-right" style="width: 50%; vertical-align: top; padding-bottom: 10px; text-align: right;">
              <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #888890; margin: 0 0 3px 0;">BILLED TO CLIENT:</p>
              <p style="font-size: 12px; font-weight: bold; color: #121215; margin: 0; word-break: break-all;">${toEmail}</p>
            </td>
          </tr>
          <tr>
            <td class="mobile-stack" style="width: 50%; vertical-align: top; padding-top: 5px;">
              <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #888890; margin: 0 0 3px 0;">ORDER DATE:</p>
              <p style="font-family: monospace; font-size: 13px; font-weight: bold; color: #121215; margin: 0;">${new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}</p>
            </td>
            <td class="mobile-stack mobile-right" style="width: 50%; vertical-align: top; padding-top: 5px; text-align: right;">
              <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #888890; margin: 0 0 3px 0;">PAYMENT STATUS:</p>
              <p style="font-size: 11px; font-weight: bold; color: #059669; margin: 0; text-transform: uppercase;">Verified Paid / Confirmed</p>
            </td>
          </tr>
        </table>

        <div style="border-bottom: 1px solid #E8E4DC; margin-bottom: 20px;"></div>

        <!-- ITEMS TABLE -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; box-sizing: border-box;">
          <thead>
            <tr style="border-bottom: 1px solid #E8E4DC; background-color: #FAF8F5;">
              <th style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #555560; text-align: left; padding: 8px 0; font-weight: normal;">ITEM</th>
              <th style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #555560; text-align: center; padding: 8px 5px; font-weight: normal;">QTY</th>
              <th style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #555560; text-align: right; padding: 8px 0; font-weight: normal;">PRICE</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- SUMMARY SECTION -->
        <div style="border-top: 1px solid #E8E4DC; padding-top: 15px; margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <td style="color: #555560; padding-bottom: 6px;">Subtotal:</td>
              <td style="text-align: right; font-family: monospace; font-size: 13px; font-weight: bold; color: #121215; padding-bottom: 6px;">₹${Number(order.total).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color: #555560; padding-bottom: 6px;">GST (Included):</td>
              <td style="text-align: right; font-family: monospace; font-size: 13px; color: #121215; padding-bottom: 6px;">₹0.00</td>
            </tr>
            <tr>
              <td style="color: #555560; padding-bottom: 10px;">Atelier Shipping:</td>
              <td style="text-align: right; font-size: 10px; font-weight: bold; color: #059669; padding-bottom: 10px; letter-spacing: 0.05em;">COMPLIMENTARY</td>
            </tr>
            <tr style="border-top: 1px solid #E8E4DC;">
              <td style="font-size: 14px; font-weight: bold; color: #121215; padding-top: 10px;">Total Paid:</td>
              <td style="text-align: right; font-family: monospace; font-size: 18px; font-weight: bold; color: #121215; padding-top: 10px;">₹${Number(order.total).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #E8E4DC; margin-bottom: 20px;"></div>

        <!-- FOOTER -->
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #888890;">
          <tr>
            <td>CRAFTED FOR DISTINCTION</td>
            <td style="text-align: right; color: #121215; font-weight: bold;">📄 PDF INVOICE ATTACHED</td>
          </tr>
        </table>

      </div>
    `;

    await sendEmail({
      to: toEmail,
      subject: `Order Confirmed & Invoice - #INV-SUKO-${1000 + order.id}`,
      html: wrapResponsiveEmail(content),
      attachments,
    });
    console.log('✉️ Premium Order Email & PDF Invoice sent to:', toEmail);
  } catch (err) {
    console.error('Failed to send order email:', err.message);
  }
}

// 3. Send Order Cancellation Email
async function sendOrderCancellationEmail(toEmail, order, statusType = 'requested') {
  try {
    let subject = `Cancellation Request Submitted - #SUKO-${1000 + order.id}`;
    let title = "Cancellation Request Submitted";
    let bodyText = `Your request to cancel Order <strong>#SUKO-${1000 + order.id}</strong> has been received and is pending studio review.`;

    if (statusType === 'approved') {
      subject = `Cancellation Approved & Refund Initiated - #SUKO-${1000 + order.id}`;
      title = "Cancellation Approved";
      bodyText = `Your order <strong>#SUKO-${1000 + order.id}</strong> cancellation has been <strong>Approved</strong>. Any payment made will be refunded within 3-5 business days.`;
    } else if (statusType === 'rejected') {
      subject = `Cancellation Request Update - #SUKO-${1000 + order.id}`;
      title = "Cancellation Request Update";
      bodyText = `Your cancellation request for Order <strong>#SUKO-${1000 + order.id}</strong> could not be processed as your garments are already in active dispatch preparation.`;
    }

    const content = `
      <div class="card-body" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8E4DC; padding: 35px 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); box-sizing: border-box;">
        <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #C2922E; font-weight: bold; margin: 0;">— Order Notice</p>
        <h1 class="brand-title" style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: normal; margin: 10px 0 16px 0; color: #121215;">${title}</h1>
        
        <p style="color: #555560; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">${bodyText}</p>
        
        <div style="background-color: #FAF8F5; border-left: 3px solid #C2922E; border: 1px solid #E8E4DC; border-left-width: 3px; padding: 14px; margin: 20px 0; border-radius: 6px; box-sizing: border-box;">
          <p style="margin: 0; font-size: 12px; color: #121215;"><strong>Order Number:</strong> #SUKO-${1000 + order.id}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #121215;"><strong>Order Total:</strong> ₹${Number(order.total).toLocaleString('en-IN')}</p>
        </div>

        <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 25px 0 20px 0;" />
        <p style="font-size: 10px; color: #888890; text-transform: uppercase; text-align: center; letter-spacing: 0.18em; margin: 0;">SUKO Atelier · Client Relations</p>
      </div>
    `;

    await sendEmail({
      to: toEmail,
      subject: subject,
      html: wrapResponsiveEmail(content),
    });
    console.log('✉️ Cancellation Email sent to:', toEmail);
  } catch (err) {
    console.error('Failed to send cancellation email:', err.message);
  }
}

// 4. Send Custom Admin Broadcast / Client Notice Email
async function sendCustomAdminBroadcastEmail(toEmail, subject, messageText) {
  try {
    const content = `
      <div class="card-body" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8E4DC; padding: 35px 25px; border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.03); box-sizing: border-box;">
        
        <div style="margin-bottom: 20px;">
          <h1 class="brand-title" style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: normal; letter-spacing: 0.08em; color: #121215; margin: 0 0 4px 0;">SUKO ATELIER</h1>
          <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.22em; color: #C2922E; font-weight: bold; margin: 0;">— EXCLUSIVE CLIENT COMMUNICATION</p>
        </div>

        <div style="border-bottom: 1px solid #E8E4DC; margin-bottom: 20px;"></div>

        <div style="color: #44444A; font-size: 14px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; margin-bottom: 25px;">
${messageText}
        </div>

        <div style="border-top: 1px solid #E8E4DC; padding-top: 20px; text-align: center;">
          <p style="font-size: 10px; color: #888890; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">SUKO Atelier · Private Concierge</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: toEmail,
      subject: subject || 'SUKO Atelier Exclusive Notice',
      html: wrapResponsiveEmail(content),
    });
    console.log('✉️ Custom Admin Email sent to:', toEmail);
  } catch (err) {
    console.error('Failed to send custom admin email:', err.message);
  }
}

// 5. Send OTP Email for Login or Reset Password
async function sendOTPEmail(toEmail, otpCode, purpose = 'Verification') {
  try {
    const content = `
      <div class="card-body" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8E4DC; padding: 35px 25px; border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.03); box-sizing: border-box; text-align: left;">
        
        <div style="margin-bottom: 20px;">
          <h1 class="brand-title" style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: normal; letter-spacing: 0.08em; color: #121215; margin: 0 0 4px 0;">SUKO ATELIER</h1>
          <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.22em; color: #C2922E; font-weight: bold; margin: 0;">— ONE-TIME PASSCODE</p>
        </div>

        <div style="border-bottom: 1px solid #E8E4DC; margin-bottom: 20px;"></div>

        <p style="color: #555560; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Use the following 6-digit passcode to complete your <strong>SUKO ${purpose}</strong>. This code is valid for 10 minutes.
        </p>

        <!-- OTP CALLOUT BOX (MOBILE PERFECT) -->
        <div class="otp-display" style="background: #FAF8F5; border: 1.5px solid #C2922E; border-radius: 8px; padding: 18px 10px; text-align: center; margin: 0 0 20px 0; box-sizing: border-box;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 0.18em; color: #121215; display: inline-block; max-width: 100%; word-break: break-all;">${otpCode}</span>
        </div>

        <p style="color: #888890; font-size: 12px; line-height: 1.5; margin: 0 0 20px 0;">
          If you did not request this verification code, please ignore this email or notify security.
        </p>

        <div style="border-top: 1px solid #E8E4DC; padding-top: 18px; text-align: center;">
          <p style="font-size: 10px; color: #888890; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">SUKO Atelier · Private Concierge Security</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: toEmail,
      subject: `${otpCode} is your SUKO Atelier ${purpose} Code`,
      html: wrapResponsiveEmail(content),
    });
    console.log(`🔑 OTP Email (${purpose}) sent to:`, toEmail);
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
    throw new Error('Failed to deliver OTP email. Please verify your email address.');
  }
}

module.exports = {
  sendLoginNotificationEmail,
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendCustomAdminBroadcastEmail,
  sendOTPEmail,
};
