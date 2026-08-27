import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'SUKO Atelier <orders@indiancorporatewear.com>';

/**
 * Send email using Resend with verified domain (indiancorporatewear.com)
 */
export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  if (!resend) {
    console.warn('[Resend Warning] RESEND_API_KEY is not configured in .env');
    return { mock: true };
  }

  try {
    const formattedAttachments = attachments.map(att => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content)
    }));

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      attachments: formattedAttachments.length > 0 ? formattedAttachments : undefined
    });

    if (response.error) {
      console.error('[Resend Error]', response.error);
      throw new Error(response.error.message || 'Resend failed to send email');
    }

    console.log(`[Resend Success] Email delivered to ${to} (ID: ${response.data?.id})`);
    return response;
  } catch (err) {
    console.error(`[Resend Exception] Error sending to ${to}:`, err.message);
    throw err;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  return sendEmail({
    to: email,
    subject: '✨ Welcome to SUKO Atelier',
    html: `
      <div style="font-family: 'Helvetica', sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #c6a46a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
        <div style="background: #5e0a0b; color: #ffffff; padding: 25px; text-align: center;">
          <h2 style="font-family: serif; letter-spacing: 2px; margin: 0; font-size: 20px; color: #ffffff;">SUKO ATELIER</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #c6a46a; letter-spacing: 1px;">WELCOME TO LUXURY</p>
        </div>
        <div style="padding: 30px; text-align: center; color: #333333;">
          <h3 style="color: #5e0a0b; margin-top: 0; font-size: 20px;">Welcome, ${name || 'Valued Client'}!</h3>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">Thank you for registering with <strong>SUKO Atelier</strong> — luxury handcrafted ethnic wear.</p>
          
          <div style="background: #f8f5f0; border: 1px dashed #c6a46a; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #5e0a0b; font-weight: bold; font-size: 14px;">Bespoke Craftsmanship & Timeless Heritage</p>
          </div>

          <p style="font-size: 13px; color: #666;">Explore our exclusive lehengas, sarees, and couture collections online now.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 11px; color: #aaa;">If you have any questions, feel free to reply directly to this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendOrderConfirmationEmail = async (email, order, pdfBuffer = null) => {
  const attachments = pdfBuffer ? [
    {
      filename: `SUKO_Invoice_#SUKO-${order.id}.pdf`,
      content: pdfBuffer
    }
  ] : [];

  const isCod = order.payment_id === 'COD' || order.payments?.some(p => p.gateway === 'COD' || p.payment_reference === 'CASH_ON_DELIVERY');
  const methodLabel = isCod ? 'Cash on Delivery (COD)' : 'Online Payment (Prepaid)';
  const statusLabel = isCod ? 'Order Confirmed (Payment Pending on Delivery)' : 'PAID & CONFIRMED';
  const statusColor = isCod ? '#d35400' : '#27ae60';

  const itemsHtml = order.items && order.items.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
      <thead>
        <tr style="border-bottom: 2px solid #5e0a0b; color: #5e0a0b; text-align: left;">
          <th style="padding: 8px;">Item</th>
          <th style="padding: 8px; text-align: center;">Size</th>
          <th style="padding: 8px; text-align: center;">Qty</th>
          <th style="padding: 8px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${item.product?.name || 'Luxury Ensemble'}</td>
            <td style="padding: 8px; text-align: center;">${item.size || 'M'}</td>
            <td style="padding: 8px; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; text-align: right;">₹${Number((item.price_at_purchase || item.price || 0) * item.quantity).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  return sendEmail({
    to: email,
    subject: isCod
      ? `📦 COD Order Confirmed #SUKO-${order.id} - SUKO Atelier`
      : `✨ Order Confirmed #SUKO-${order.id} - SUKO Atelier`,
    attachments,
    html: `
      <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #c6a46a; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.08);">
        <div style="background: #5e0a0b; color: #ffffff; padding: 25px; text-align: center;">
          <h2 style="font-family: serif; letter-spacing: 2px; margin: 0;">SUKO ATELIER</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #c6a46a; letter-spacing: 1px;">${isCod ? 'COD ORDER CONFIRMATION' : 'ORDER CONFIRMATION'}</p>
        </div>
        <div style="padding: 25px; color: #333333; line-height: 1.6;">
          <h3 style="color: #5e0a0b; margin-top: 0;">Thank you for your order!</h3>
          <p>Your order <strong>#SUKO-${order.id}</strong> has been successfully placed and is being prepared for dispatch.</p>
          
          <div style="background: #f8f5f0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5e0a0b;">
            <p style="margin: 0 0 5px 0;"><strong>Order Reference:</strong> #SUKO-${order.id}</p>
            <p style="margin: 0 0 5px 0;"><strong>Total Amount:</strong> ₹${Number(order.total).toLocaleString('en-IN')}</p>
            <p style="margin: 0 0 5px 0;"><strong>Payment Method:</strong> ${methodLabel}</p>
            <p style="margin: 0;"><strong>Payment Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusLabel}</span></p>
          </div>

          ${itemsHtml}

          ${pdfBuffer ? '<p style="margin-top: 15px;">📄 Your Tax Invoice PDF is attached to this email for your records.</p>' : ''}
          
          <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
            If you have any questions, reply directly to this email or contact us at <a href="mailto:orders@indiancorporatewear.com" style="color: #5e0a0b;">orders@indiancorporatewear.com</a>.
          </p>
        </div>
      </div>
    `,
  });
};

export const sendCancellationRequestEmail = async (email, orderId, reason) => {
  return sendEmail({
    to: email,
    subject: `Order Cancellation Request Submitted - #SUKO-${orderId}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; background: #f8f5f0;">
        <h2 style="color: #5e0a0b;">Cancellation Request Received</h2>
        <p>Your cancellation request for order <strong>#SUKO-${orderId}</strong> has been received.</p>
        <p><strong>Reason provided:</strong> ${reason}</p>
        <p>Our concierge team will review your request within 24 hours and notify you once processed.</p>
      </div>
    `,
  });
};

export const sendCancellationStatusEmail = async (email, orderId, isAccepted, note = '') => {
  const statusTitle = isAccepted ? 'Cancellation Approved' : 'Cancellation Request Rejected';
  const statusColor = isAccepted ? '#e74c3c' : '#27ae60';

  return sendEmail({
    to: email,
    subject: `Order #${orderId} - ${statusTitle}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; background: #ffffff; border: 1px solid #c6a46a; border-radius: 10px;">
        <h2 style="color: ${statusColor};">${statusTitle}</h2>
        <p>Your request to cancel order <strong>#SUKO-${orderId}</strong> has been <strong>${isAccepted ? 'ACCEPTED' : 'REJECTED'}</strong> by our admin team.</p>
        ${note ? `<p><strong>Admin Note:</strong> ${note}</p>` : ''}
        ${isAccepted ? '<p>Any payment made will be refunded to your original payment method within 3-5 business days.</p>' : '<p>Your order will proceed with fulfillment as scheduled.</p>'}
      </div>
    `,
  });
};

export const sendOrderStatusUpdateEmail = async (email, orderId, status) => {
  return sendEmail({
    to: email,
    subject: `Order #SUKO-${orderId} Status Update: ${status}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; background: #ffffff; border: 1px solid #5e0a0b; border-radius: 10px;">
        <h2 style="color: #5e0a0b;">Order Update</h2>
        <p>The status of your order <strong>#SUKO-${orderId}</strong> has been updated to: <strong style="color: #c6a46a;">${status.toUpperCase()}</strong>.</p>
      </div>
    `,
  });
};

export const sendPasswordResetOtpEmail = async (email, otp) => {
  return sendEmail({
    to: email,
    subject: '🔑 Password Reset OTP - SUKO Atelier',
    html: `
      <div style="font-family: 'Helvetica', sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #c6a46a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
        <div style="background: #5e0a0b; color: #ffffff; padding: 25px; text-align: center;">
          <h2 style="font-family: serif; letter-spacing: 2px; margin: 0; font-size: 20px; color: #ffffff;">SUKO ATELIER</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #c6a46a; letter-spacing: 1px;">PASSWORD RESET OTP</p>
        </div>
        <div style="padding: 30px; text-align: center; color: #333333;">
          <h3 style="color: #5e0a0b; margin-top: 0; font-size: 18px;">Password Reset Request</h3>
          <p style="color: #666; font-size: 14px;">Your One-Time Password (OTP) for resetting your account password is:</p>
          
          <div style="background: #f8f5f0; border: 1px dashed #c6a46a; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #5e0a0b; letter-spacing: 6px; font-family: monospace;">${otp}</span>
          </div>

          <p style="font-size: 12px; color: #888;">This OTP code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 11px; color: #aaa;">If you did not request a password reset, please ignore this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendLoginOtpEmail = async (email, otp) => {
  return sendEmail({
    to: email,
    subject: '🔑 Your Login OTP - SUKO Atelier',
    html: `
      <div style="font-family: 'Helvetica', sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #c6a46a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
        <div style="background: #5e0a0b; color: #ffffff; padding: 25px; text-align: center;">
          <h2 style="font-family: serif; letter-spacing: 2px; margin: 0; font-size: 20px;">SUKO ATELIER</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #c6a46a; letter-spacing: 1px;">SECURE LOGIN OTP</p>
        </div>
        <div style="padding: 30px; text-align: center; color: #333333;">
          <h3 style="color: #5e0a0b; margin-top: 0;">One-Time Password (OTP)</h3>
          <p style="color: #666; font-size: 14px;">Use the following 6-digit OTP code to securely log in to your account:</p>
          
          <div style="background: #f8f5f0; border: 1px dashed #c6a46a; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #5e0a0b; letter-spacing: 6px; font-family: monospace;">${otp}</span>
          </div>

          <p style="font-size: 12px; color: #888;">This OTP is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone for security.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 11px; color: #aaa;">If you did not request this OTP login, please ignore this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendRegisterOtpEmail = async (email, otp, name = 'Client') => {
  return sendEmail({
    to: email,
    subject: '✨ Account Registration OTP - SUKO Atelier',
    html: `
      <div style="font-family: 'Helvetica', sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #c6a46a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
        <div style="background: #5e0a0b; color: #ffffff; padding: 25px; text-align: center;">
          <h2 style="font-family: serif; letter-spacing: 2px; margin: 0; font-size: 20px;">SUKO ATELIER</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #c6a46a; letter-spacing: 1px;">VERIFY YOUR ACCOUNT</p>
        </div>
        <div style="padding: 30px; text-align: center; color: #333333;">
          <h3 style="color: #5e0a0b; margin-top: 0;">Welcome, ${name}!</h3>
          <p style="color: #666; font-size: 14px;">Your One-Time Password (OTP) to complete your registration with SUKO Atelier is:</p>
          
          <div style="background: #f8f5f0; border: 1px dashed #c6a46a; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #5e0a0b; letter-spacing: 6px; font-family: monospace;">${otp}</span>
          </div>

          <p style="font-size: 12px; color: #888;">This OTP is valid for <strong>10 minutes</strong>. Enter this code to verify your email and create your account password.</p>
        </div>
      </div>
    `,
  });
};
