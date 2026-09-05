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
  const subject = `[SUKO Atelier] ${otp} is your verification code`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>SUKO Atelier Verification</title>
      <style>
        body { margin: 0; padding: 32px 16px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111113; }
        .card { max-width: 480px; margin: 0 auto; background: #FFFFFF; border: 1px solid #EAE6DF; border-radius: 4px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.03); }
        .logo { text-align: center; font-size: 24px; font-weight: 300; letter-spacing: 0.3em; text-transform: uppercase; color: #111113; margin-bottom: 24px; }
        .divider { height: 1px; background-color: #EAE6DF; margin-bottom: 28px; }
        .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.24em; color: #C2922E; text-align: center; font-weight: 600; margin-bottom: 8px; }
        .heading { font-size: 20px; font-weight: 400; text-align: center; color: #111113; margin: 0 0 16px 0; letter-spacing: 0.02em; }
        .text { font-size: 13px; line-height: 1.6; color: #6E6E75; text-align: center; margin-bottom: 28px; }
        .code-container { background-color: #FAF8F5; border: 1px dashed #C2922E; border-radius: 4px; padding: 18px 24px; text-align: center; margin: 0 auto 24px auto; max-width: 240px; }
        .code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.32em; color: #111113; margin: 0; padding-left: 0.32em; }
        .notice { font-size: 11px; color: #8C887B; text-align: center; margin-bottom: 28px; letter-spacing: 0.04em; }
        .footer { border-top: 1px solid #EAE6DF; padding-top: 20px; font-size: 11px; line-height: 1.5; color: #8C887B; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">S U K O</div>
        <div class="divider"></div>
        <div class="eyebrow">Client Verification</div>
        <h1 class="heading">Confirm Your Atelier Email</h1>
        <p class="text">
          Hello${recipientName ? ` ${recipientName}` : ""}, welcome to SUKO. Please use the authorization code below to verify your email address and activate your account.
        </p>
        <div class="code-container">
          <p class="code">${otp}</p>
        </div>
        <p class="notice">This single-use code will expire in 10 minutes.</p>
        <div class="footer">
          If you did not request this verification, please disregard this email.<br>
          SUKO Atelier &middot; The Indian Corporate Wear
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await resendClient.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject,
      html
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
