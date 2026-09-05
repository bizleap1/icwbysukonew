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

module.exports = {
  sendVerificationOtpEmail
};
