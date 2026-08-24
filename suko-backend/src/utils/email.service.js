const { Resend } = require('resend');
const { generateInvoicePDF } = require('./pdfGenerator');

// Initialize Resend Client with API Key
const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'ICW by Suko <onboarding@resend.dev>';

console.log(`📧 Email Provider: Resend HTTPS API (Sender: "${SENDER_EMAIL}")`);

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
    await sendEmail({
      to: toEmail,
      subject: 'Security Notice: Sign In to your Suko Account',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF8F5; color: #121215; padding: 40px 20px;">
          <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8E4DC; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.28em; color: #C2922E; font-weight: bold; margin: 0 0 10px 0;">— SECURITY NOTICE</p>
            <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: normal; margin: 0 0 20px 0; color: #121215;">Hello ${userName || 'Valued Client'},</h2>
            <p style="color: #555560; font-size: 14px; line-height: 1.6;">You have successfully signed in to your <strong>SUKO Atelier</strong> account.</p>
            
            <div style="background-color: #FAF8F5; border-left: 3px solid #C2922E; border: 1px solid #E8E4DC; border-left-width: 3px; padding: 15px; margin: 25px 0; border-radius: 6px;">
              <p style="margin: 0; font-size: 12px; color: #121215;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN')}</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #121215;"><strong>Status:</strong> Authenticated Active Session</p>
            </div>

            <p style="color: #888890; font-size: 12px; line-height: 1.5;">If this wasn't you, please reset your password immediately or contact our concierge support team.</p>
            <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 30px 0;" />
            <p style="font-size: 10px; color: #888890; text-transform: uppercase; letter-spacing: 0.25em; text-align: center;">SUKO Atelier · Crafted For Distinction</p>
          </div>
        </div>
      `,
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
        <td style="padding: 16px 0; border-bottom: 1px solid #E8E4DC; vertical-align: top;">
          <p style="font-size: 14px; font-weight: bold; color: #121215; margin: 0 0 4px 0;">${item.product?.name || 'Garment Item'}</p>
          <p style="font-size: 11px; color: #888890; margin: 0;">Size: ${item.size || 'STD'}</p>
        </td>
        <td style="padding: 16px 0; border-bottom: 1px solid #E8E4DC; text-align: center; font-family: monospace; font-size: 14px; color: #121215; vertical-align: top;">
          ${item.quantity}
        </td>
        <td style="padding: 16px 0; border-bottom: 1px solid #E8E4DC; text-align: right; font-family: monospace; font-size: 14px; font-weight: bold; color: #121215; vertical-align: top;">
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

    await sendEmail({
      to: toEmail,
      subject: `Order Confirmed & Invoice - #INV-SUKO-${1000 + order.id}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF8F5; color: #121215; padding: 40px 15px;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8E4DC; padding: 45px 40px; box-shadow: 0 4px 25px rgba(0,0,0,0.04); border-radius: 12px;">
            
            <!-- BRAND HEADER -->
            <div style="margin-bottom: 25px;">
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 30px; font-weight: normal; letter-spacing: 0.1em; color: #121215; margin: 0 0 6px 0;">SUKO ATELIER</h1>
              <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: #C2922E; font-weight: bold; margin: 0;">OFFICIAL TAX INVOICE & ORDER CONFIRMATION</p>
            </div>

            <div style="border-bottom: 1px solid #E8E4DC; margin-bottom: 30px;"></div>

            <!-- METADATA GRID -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px;">
              <tr>
                <td style="width: 50%; vertical-align: top; padding-bottom: 15px;">
                  <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #888890; margin: 0 0 4px 0;">INVOICE NO:</p>
                  <p style="font-family: monospace; font-size: 15px; font-weight: bold; color: #121215; margin: 0;">INV-SUKO-${1000 + order.id}</p>
                </td>
                <td style="width: 50%; vertical-align: top; padding-bottom: 15px; text-align: right;">
                  <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #888890; margin: 0 0 4px 0;">BILLED TO CLIENT:</p>
                  <p style="font-size: 13px; font-weight: bold; color: #121215; margin: 0;">${toEmail}</p>
                </td>
              </tr>
              <tr>
                <td style="width: 50%; vertical-align: top;">
                  <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #888890; margin: 0 0 4px 0;">ORDER DATE:</p>
                  <p style="font-family: monospace; font-size: 14px; font-weight: bold; color: #121215; margin: 0;">${new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}</p>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right;">
                  <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #888890; margin: 0 0 4px 0;">PAYMENT STATUS:</p>
                  <p style="font-size: 12px; font-weight: bold; color: #059669; margin: 0; text-transform: uppercase;">Verified Paid / Confirmed</p>
                </td>
              </tr>
            </table>

            <div style="border-bottom: 1px solid #E8E4DC; margin-bottom: 25px;"></div>

            <!-- ITEMS TABLE -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="border-bottom: 1px solid #E8E4DC; background-color: #FAF8F5;">
                  <th style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #555560; text-align: left; padding: 10px; font-weight: normal;">ITEM DESCRIPTION</th>
                  <th style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #555560; text-align: center; padding: 10px; font-weight: normal;">QTY</th>
                  <th style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #555560; text-align: right; padding: 10px; font-weight: normal;">PRICE</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- SUMMARY SECTION -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px;">
              <tr>
                <td style="width: 35%;"></td>
                <td style="width: 65%;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                      <td style="color: #555560; padding-bottom: 8px;">Subtotal:</td>
                      <td style="text-align: right; font-family: monospace; font-size: 14px; font-weight: bold; color: #121215; padding-bottom: 8px;">₹${Number(order.total).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style="color: #555560; padding-bottom: 8px;">GST (Included):</td>
                      <td style="text-align: right; font-family: monospace; font-size: 14px; color: #121215; padding-bottom: 8px;">₹0.00</td>
                    </tr>
                    <tr>
                      <td style="color: #555560; padding-bottom: 12px;">Atelier Shipping:</td>
                      <td style="text-align: right; font-size: 11px; font-weight: bold; color: #059669; padding-bottom: 12px; letter-spacing: 0.1em;">COMPLIMENTARY</td>
                    </tr>
                    <tr style="border-top: 1px solid #E8E4DC;">
                      <td style="font-size: 15px; font-weight: bold; color: #121215; padding-top: 12px;">Total Paid:</td>
                      <td style="text-align: right; font-family: monospace; font-size: 20px; font-weight: bold; color: #121215; padding-top: 12px;">₹${Number(order.total).toLocaleString('en-IN')}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="border-top: 1px solid #E8E4DC; margin-bottom: 25px;"></div>

            <!-- FOOTER -->
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #888890;">
              <tr>
                <td>CRAFTED FOR DISTINCTION · ATELIER EXCELLENCE</td>
                <td style="text-align: right; color: #121215; font-weight: bold;">📄 PDF TAX INVOICE ATTACHED</td>
              </tr>
            </table>

          </div>
        </div>
      `,
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

    await sendEmail({
      to: toEmail,
      subject: subject,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF8F5; color: #121215; padding: 40px 20px;">
          <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8E4DC; padding: 35px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: #C2922E; font-weight: bold; margin: 0;">— Order Notice</p>
            <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: normal; margin: 10px 0 20px 0; color: #121215;">${title}</h1>
            
            <p style="color: #555560; font-size: 14px; line-height: 1.6;">${bodyText}</p>
            
            <div style="background-color: #FAF8F5; border-left: 3px solid #C2922E; border: 1px solid #E8E4DC; border-left-width: 3px; padding: 15px; margin: 25px 0; border-radius: 6px;">
              <p style="margin: 0; font-size: 13px; color: #121215;"><strong>Order Number:</strong> #SUKO-${1000 + order.id}</p>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #121215;"><strong>Order Total:</strong> ₹${Number(order.total).toLocaleString('en-IN')}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 30px 0;" />
            <p style="font-size: 10px; color: #888890; text-transform: uppercase; text-align: center; letter-spacing: 0.2em;">SUKO Atelier · Client Relations</p>
          </div>
        </div>
      `,
    });
    console.log('✉️ Cancellation Email sent to:', toEmail);
  } catch (err) {
    console.error('Failed to send cancellation email:', err.message);
  }
}

// 4. Send Custom Admin Broadcast / Client Notice Email
async function sendCustomAdminBroadcastEmail(toEmail, subject, messageText) {
  try {
    await sendEmail({
      to: toEmail,
      subject: subject || 'SUKO Atelier Exclusive Notice',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF8F5; color: #121215; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8E4DC; padding: 40px; border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.04);">
            
            <div style="margin-bottom: 25px;">
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: normal; letter-spacing: 0.1em; color: #121215; margin: 0 0 6px 0;">SUKO ATELIER</h1>
              <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #C2922E; font-weight: bold; margin: 0;">— EXCLUSIVE CLIENT COMMUNICATION</p>
            </div>

            <div style="border-bottom: 1px solid #E8E4DC; margin-bottom: 30px;"></div>

            <div style="color: #44444A; font-size: 14px; line-height: 1.8; white-space: pre-wrap; margin-bottom: 35px;">
${messageText}
            </div>

            <div style="border-top: 1px solid #E8E4DC; padding-top: 25px; text-align: center;">
              <p style="font-size: 10px; color: #888890; text-transform: uppercase; letter-spacing: 0.25em; margin: 0;">SUKO Atelier · Private Concierge</p>
            </div>
          </div>
        </div>
      `
    });
    console.log('✉️ Custom Admin Email sent to:', toEmail);
  } catch (err) {
    console.error('Failed to send custom admin email:', err.message);
  }
}

// 5. Send OTP Email for Login or Reset Password
async function sendOTPEmail(toEmail, otpCode, purpose = 'Verification') {
  try {
    await sendEmail({
      to: toEmail,
      subject: `${otpCode} is your SUKO Atelier ${purpose} Code`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF8F5; color: #121215; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8E4DC; padding: 40px; border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.04);">
            
            <div style="margin-bottom: 25px;">
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: normal; letter-spacing: 0.1em; color: #121215; margin: 0 0 6px 0;">SUKO ATELIER</h1>
              <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #C2922E; font-weight: bold; margin: 0;">— ONE-TIME PASSCODE</p>
            </div>

            <div style="border-bottom: 1px solid #E8E4DC; margin-bottom: 25px;"></div>

            <p style="color: #555560; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
              Use the following 6-digit passcode to complete your <strong>SUKO ${purpose}</strong>. This code is valid for 10 minutes. Do not share this code with anyone.
            </p>

            <!-- OTP CALLOUT BOX -->
            <div style="background: #FAF8F5; border: 1.5px solid #C2922E; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 25px;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 0.3em; color: #121215; display: inline-block;">${otpCode}</span>
            </div>

            <p style="color: #888890; font-size: 12px; line-height: 1.5; margin-bottom: 25px;">
              If you did not request this verification code, please ignore this email or notify security.
            </p>

            <div style="border-top: 1px solid #E8E4DC; padding-top: 20px; text-align: center;">
              <p style="font-size: 10px; color: #888890; text-transform: uppercase; letter-spacing: 0.25em; margin: 0;">SUKO Atelier · Private Concierge Security</p>
            </div>
          </div>
        </div>
      `,
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
