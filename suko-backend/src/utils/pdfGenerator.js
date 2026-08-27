import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve SUKO Official Brand Logo
const findLogoPath = () => {
  const candidatePaths = [
    path.resolve(__dirname, '../../../../public/logo.png'),
    path.resolve(__dirname, '../../../public/logo.png'),
    path.resolve(__dirname, '../../public/logo.png'),
    path.resolve(process.cwd(), '../public/logo.png'),
    path.resolve(process.cwd(), 'public/logo.png')
  ];

  for (const candidate of candidatePaths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
};

/**
 * Generates an ultra-luxury, high-end Haute Couture Tax Invoice PDF
 * for SUKO Atelier.
 */
export const generateInvoicePDF = (order, stream) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 28,
    info: {
      Title: `Tax Invoice #INV-SUKO-${String(order.id).padStart(5, '0')}`,
      Author: 'SUKO Atelier',
      Subject: 'Luxury Haute Couture Tax Invoice / Retail Receipt',
      Keywords: 'suko, luxury corporate wear, tax invoice, mumbai boutique'
    }
  });

  doc.pipe(stream);

  // Haute Couture Palette
  const COLOR_BURGUNDY = '#5e0a0b';
  const COLOR_BURGUNDY_DARK = '#430607';
  const COLOR_GOLD = '#c6a46a';
  const COLOR_GOLD_LIGHT = '#e8d8be';
  const COLOR_DARK = '#1a1a1a';
  const COLOR_MUTED = '#555555';
  const COLOR_LIGHT_BG = '#FAF8F5';
  const COLOR_CARD_BG = '#FCFAF7';
  const COLOR_LINE = '#e6d8c3';

  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const margin = 28;
  const contentWidth = pageWidth - (margin * 2);

  // ─── 0. ROYAL OUTER DOUBLE BORDER FRAME & CORNER ACCENTS ───────────────────
  // Outer Gold Line
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28)
     .lineWidth(1.2)
     .stroke(COLOR_GOLD);

  // Inner Fine Hairline
  doc.rect(17.5, 17.5, pageWidth - 35, pageHeight - 35)
     .lineWidth(0.6)
     .stroke(COLOR_LINE);

  // Corner Gold Squares / Embellishments
  const drawCornerAccent = (x, y) => {
    doc.rect(x - 3, y - 3, 6, 6).fill(COLOR_GOLD);
    doc.rect(x - 1.5, y - 1.5, 3, 3).fill('#ffffff');
  };
  drawCornerAccent(14, 14);
  drawCornerAccent(pageWidth - 14, 14);
  drawCornerAccent(14, pageHeight - 14);
  drawCornerAccent(pageWidth - 14, pageHeight - 14);

  let currentY = 26;

  // ─── 1. TOP HEADER & BRANDING (WITH OFFICIAL LOGO) ─────────────────────────
  const logoPath = findLogoPath();
  const logoWidth = 62;
  const logoHeight = 68;

  if (logoPath) {
    try {
      doc.image(logoPath, margin + 4, currentY + 2, { fit: [logoWidth, logoHeight], align: 'center' });
    } catch (_) {
      // Fallback if image rendering encounters any issue
    }
  }

  const headerTextX = logoPath ? margin + logoWidth + 14 : margin + 4;
  const headerRightWidth = 175;
  const headerTextMaxWidth = contentWidth - headerRightWidth - (logoPath ? logoWidth + 18 : 10);

  // Brand Name
  doc.font('Helvetica-Bold')
     .fontSize(20)
     .fillColor(COLOR_BURGUNDY)
     .text('SUKO ATELIER', headerTextX, currentY + 3, { characterSpacing: 1.8, width: headerTextMaxWidth });

  // Tagline
  doc.font('Helvetica-Bold')
     .fontSize(7.6)
     .fillColor(COLOR_GOLD)
     .text('HAUTE COUTURE & LUXURY TROUSSEAU ATELIER', headerTextX, currentY + 25, { characterSpacing: 0.8 });

  // Boutique Address & Tax Details
  doc.font('Helvetica')
     .fontSize(7.2)
     .fillColor(COLOR_MUTED)
     .text('Flagship Atelier: Shop no. UG/5, Jagat Plaza, Law College Square, Nagpur, MH 440033', headerTextX, currentY + 37, { width: headerTextMaxWidth })
     .text('GSTIN: 27AABCM9876Q1Z5  |  State: 27 (Maharashtra)  |  Ph: +91 92712 18156', headerTextX, currentY + 47, { width: headerTextMaxWidth })
     .text('Web: www.indiancorporatewear.com  |  Email: orders@indiancorporatewear.com', headerTextX, currentY + 57, { width: headerTextMaxWidth });

  // Header Right Box: Official Tax Invoice Badge & Invoice Meta
  const rightBoxX = pageWidth - margin - headerRightWidth;
  doc.roundedRect(rightBoxX, currentY, headerRightWidth, 23, 4).fill(COLOR_BURGUNDY);

  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor('#ffffff')
     .text('OFFICIAL TAX INVOICE', rightBoxX, currentY + 7, { width: headerRightWidth, align: 'center', characterSpacing: 0.5 });

  const orderDateStr = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const invoiceNo = `INV-SUKO-${String(order.id).padStart(5, '0')}`;
  const paymentRefStr = order.payment_id || (order.payment_method === 'cod' ? 'CASH ON DELIVERY' : 'ONLINE PREPAID');

  doc.font('Helvetica-Bold')
     .fontSize(8.5)
     .fillColor(COLOR_BURGUNDY)
     .text(`Invoice No: ${invoiceNo}`, rightBoxX, currentY + 29, { width: headerRightWidth, align: 'right' });

  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor(COLOR_MUTED)
     .text(`Invoice Date: ${orderDateStr}`, rightBoxX, currentY + 41, { width: headerRightWidth, align: 'right' })
     .text(`Order Reference: #ORD-${order.id}`, rightBoxX, currentY + 52, { width: headerRightWidth, align: 'right' })
     .text(`Payment Ref: ${paymentRefStr.slice(0, 24)}`, rightBoxX, currentY + 63, { width: headerRightWidth, align: 'right' });

  currentY += 76;

  // Gold Filigree Divider
  doc.rect(margin, currentY, contentWidth, 1.2).fill(COLOR_GOLD);
  currentY += 10;

  // ─── 2. BILLED TO & SHIPPED TO DUAL CARDS ──────────────────────────────────
  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 84;

  let billObj = order.billingDetails;
  if (typeof billObj === 'string') {
    try { billObj = JSON.parse(billObj); } catch(_) { billObj = {}; }
  }
  billObj = billObj || {};

  let shipObj = order.shippingDetails;
  if (typeof shipObj === 'string') {
    try { shipObj = JSON.parse(shipObj); } catch(_) { shipObj = {}; }
  }
  shipObj = shipObj || {};

  const customerName = billObj.fullName || order.user?.name || order.shipping_name || 'Valued Client';
  const customerEmail = billObj.email || order.user?.email || shipObj.email || 'N/A';
  const customerPhone = billObj.phone || order.shipping_phone || order.user?.phone || 'N/A';
  const billAddress = billObj.addressString || (billObj.line1 ? `${billObj.line1}, ${billObj.city || ''} ${billObj.pincode || ''}` : '') || order.shipping_address || 'Nagpur Flagship Boutique Atelier';
  const billGstin = billObj.gstin ? `  |  GSTIN: ${billObj.gstin}` : '';

  const shipName = shipObj.fullName || order.shipping_name || customerName;
  const shipPhone = shipObj.phone || order.shipping_phone || customerPhone;
  const shipAddress = order.shipping_address || shipObj.addressString || (shipObj.line1 ? `${shipObj.line1}, ${shipObj.city || ''} ${shipObj.pincode || ''}` : '') || 'Nagpur Flagship Boutique Dispatch';
  const shipCityState = [shipObj.city || order.shipping_city, shipObj.state || order.shipping_state, shipObj.pincode || order.shipping_pincode].filter(Boolean).join(', ') || 'Nagpur, Maharashtra 440033';

  // Left Card: Billed To
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 4)
     .fillAndStroke(COLOR_CARD_BG, COLOR_LINE);

  doc.roundedRect(margin, currentY, cardWidth, 18, 4).fill(COLOR_LIGHT_BG);
  doc.rect(margin, currentY + 14, cardWidth, 4).fill(COLOR_LIGHT_BG); // square bottom corners of top pill

  doc.font('Helvetica-Bold')
     .fontSize(7.8)
     .fillColor(COLOR_BURGUNDY)
     .text('BILLED TO (TAX INVOICE DETAILS)', margin + 10, currentY + 5, { characterSpacing: 0.5 });

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_DARK).text(customerName, margin + 10, currentY + 22);
  doc.font('Helvetica').fontSize(7.3).fillColor(COLOR_MUTED)
     .text(`Address: ${billAddress.slice(0, 56)}`, margin + 10, currentY + 34, { width: cardWidth - 20, height: 18 })
     .text(`Email: ${customerEmail}${billGstin}`, margin + 10, currentY + 51, { width: cardWidth - 20 })
     .text(`Phone: +91 ${customerPhone.replace(/[^\d]/g, '')}  |  Place of Supply: ${billObj.state || order.shipping_state || 'Maharashtra'} (State Code: 27)`, margin + 10, currentY + 64, { width: cardWidth - 20 });

  // Right Card: Shipped To
  const rightCardX = margin + cardWidth + cardGap;
  doc.roundedRect(rightCardX, currentY, cardWidth, cardHeight, 4)
     .fillAndStroke(COLOR_CARD_BG, COLOR_LINE);

  doc.roundedRect(rightCardX, currentY, cardWidth, 18, 4).fill(COLOR_LIGHT_BG);
  doc.rect(rightCardX, currentY + 14, cardWidth, 4).fill(COLOR_LIGHT_BG);

  doc.font('Helvetica-Bold')
     .fontSize(7.8)
     .fillColor(COLOR_BURGUNDY)
     .text('SHIPPED TO (DELIVERY DESTINATION)', rightCardX + 10, currentY + 5, { characterSpacing: 0.5 });

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_DARK).text(shipName, rightCardX + 10, currentY + 22);
  doc.font('Helvetica').fontSize(7.3).fillColor(COLOR_MUTED)
     .text(`Address: ${shipAddress.slice(0, 56)}`, rightCardX + 10, currentY + 34, { width: cardWidth - 20, height: 18 })
     .text(`City/State: ${shipCityState}`, rightCardX + 10, currentY + 51, { width: cardWidth - 20 })
     .text(`Delivery Contact: +91 ${shipPhone.replace(/[^\d]/g, '')}`, rightCardX + 10, currentY + 64, { width: cardWidth - 20 });

  currentY += cardHeight + 12;

  // ─── 3. ITEM SPECIFICATION TABLE HEADER ────────────────────────────────────
  const colX = {
    sno: margin,
    desc: margin + 28,
    hsn: margin + 230,
    size: margin + 275,
    qty: margin + 330,
    rate: margin + 375,
    amount: margin + 445
  };

  doc.roundedRect(margin, currentY, contentWidth, 22, 3).fill(COLOR_BURGUNDY);

  doc.font('Helvetica-Bold')
     .fontSize(7.8)
     .fillColor('#ffffff')
     .text('S.NO', colX.sno + 6, currentY + 7)
     .text('ITEM & DESIGN SPECIFICATION', colX.desc, currentY + 7)
     .text('HSN', colX.hsn, currentY + 7)
     .text('SIZE / SKU', colX.size, currentY + 7)
     .text('QTY', colX.qty, currentY + 7, { width: 35, align: 'center' })
     .text('RATE (INR)', colX.rate, currentY + 7, { width: 65, align: 'right' })
     .text('AMOUNT (INR)', colX.amount, currentY + 7, { width: 85, align: 'right' });

  currentY += 22;

  // ─── 4. ITEM SPECIFICATION ROWS ────────────────────────────────────────────
  const items = order.items && order.items.length > 0 ? order.items : [
    {
      product: { name: 'Handcrafted Bespoke Garment' },
      size: 'Free Size',
      quantity: 1,
      price_at_purchase: order.total
    }
  ];

  items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const rowHeight = 24;

    if (isEven) {
      doc.rect(margin, currentY, contentWidth, rowHeight).fill(COLOR_LIGHT_BG);
    } else {
      doc.rect(margin, currentY, contentWidth, rowHeight).fill('#ffffff');
    }

    const unitPrice = Number(item.price_at_purchase || item.price || 0);
    const qty = Number(item.quantity || 1);
    const itemTotal = unitPrice * qty;
    const productName = item.product?.name || item.name || item.title || 'Haute Couture Ensemble';
    const itemSizeSku = item.sku_snapshot || (item.variant && item.variant.sku) || `${item.size || 'M'}`;

    doc.font('Helvetica').fontSize(7.6).fillColor(COLOR_DARK);
    doc.text(String(index + 1), colX.sno + 8, currentY + 7);
    doc.font('Helvetica-Bold').text(productName.slice(0, 38), colX.desc, currentY + 7);
    doc.font('Helvetica').fillColor(COLOR_MUTED).text('6204', colX.hsn, currentY + 7);
    doc.text(itemSizeSku.slice(0, 10), colX.size, currentY + 7);
    doc.fillColor(COLOR_DARK).text(String(qty), colX.qty, currentY + 7, { width: 35, align: 'center' });
    doc.text(`Rs. ${unitPrice.toLocaleString('en-IN')}`, colX.rate, currentY + 7, { width: 65, align: 'right' });
    doc.font('Helvetica-Bold').text(`Rs. ${itemTotal.toLocaleString('en-IN')}`, colX.amount, currentY + 7, { width: 85, align: 'right' });

    // Hairline Bottom Row Separator
    doc.rect(margin, currentY + rowHeight - 0.5, contentWidth, 0.5).fill(COLOR_LINE);
    currentY += rowHeight;
  });

  currentY += 12;

  // ─── 5. SUMMARY & TOTALS BREAKDOWN ─────────────────────────────────────────
  const subtotal = Number(order.total || 0);
  const discountAmount = Number(order.discount || 0);
  const gstEstimated = Math.round((subtotal * 18) / 118); // 18% Inclusive GST
  const netTaxable = subtotal - gstEstimated;
  const isInterstate = (order.shipping_state || '').toLowerCase().trim() !== 'maharashtra' && (order.shipping_state || '').toLowerCase().trim() !== 'mh' && Boolean(order.shipping_state);

  const summaryWidth = 240;
  const summaryX = pageWidth - margin - summaryWidth;

  // Payment Status & Seal Box (Left Side)
  const isPaid = (order.status || '').toLowerCase() !== 'cancelled' && (
    Boolean(order.payment_id && order.payment_id !== 'COD' && order.payment_id !== 'CASH_ON_DELIVERY') ||
    Boolean(order.razorpay_order_id) ||
    (Array.isArray(order.payments) && order.payments.some(p => p.status === 'PAID' || p.gateway === 'RAZORPAY')) ||
    String(order.payment_method || '').toLowerCase().includes('online') ||
    String(order.payment_method || '').toLowerCase().includes('razorpay')
  );
  const isCancelled = (order.status || '').toLowerCase() === 'cancelled';

  const stampColor = isCancelled ? '#c0392b' : (isPaid ? '#1e824c' : '#d35400');
  const stampTitle = isCancelled ? '[ CANCELLED ]' : (isPaid ? '[✓] PAYMENT CONFIRMED & VERIFIED' : '[ COD - PAYMENT ON DELIVERY ]');

  const methodStr = isPaid ? 'Razorpay Online (Prepaid)' : (order.payment_method?.toUpperCase() || 'CASH ON DELIVERY');
  const refStr = (order.payment_id && order.payment_id !== 'COD') ? order.payment_id : (order.transaction_id || (order.payments && order.payments[0]?.gateway_payment_id) || 'COD-VERIFICATION-PENDING');

  doc.roundedRect(margin, currentY, 215, 88, 4).fillAndStroke(COLOR_CARD_BG, stampColor);

  doc.font('Helvetica-Bold')
     .fontSize(8.5)
     .fillColor(stampColor)
     .text(stampTitle, margin + 10, currentY + 10);

  doc.font('Helvetica')
     .fontSize(7.3)
     .fillColor(COLOR_MUTED)
     .text(`Payment Mode: ${methodStr}`, margin + 10, currentY + 24)
     .text(`Transaction Ref: ${refStr.slice(0, 26)}`, margin + 10, currentY + 36)
     .text('GST Compliance: 18% Inclusive Tax Included', margin + 10, currentY + 48)
     .text(`Order Status: ${(order.status || 'PROCESSING').toUpperCase()}`, margin + 10, currentY + 60)
     .text('Authenticity: 100% Handcrafted Atelier Certified', margin + 10, currentY + 72);

  // Calculation Breakdown (Right Side)
  doc.font('Helvetica').fontSize(7.6).fillColor(COLOR_MUTED);
  doc.text('Taxable Base Value (Net Excl. Tax):', summaryX, currentY);
  doc.font('Helvetica-Bold').fillColor(COLOR_DARK).text(`Rs. ${netTaxable.toLocaleString('en-IN')}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
  currentY += 12;

  if (isInterstate) {
    doc.font('Helvetica').fillColor(COLOR_MUTED).text('IGST (18% Integrated GST):', summaryX, currentY);
    doc.font('Helvetica-Bold').fillColor(COLOR_DARK).text(`Rs. ${gstEstimated.toLocaleString('en-IN')}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
    currentY += 12;
  } else {
    const halfGst = Math.round(gstEstimated / 2);
    doc.font('Helvetica').fillColor(COLOR_MUTED).text('CGST (9% Central GST - MH):', summaryX, currentY);
    doc.font('Helvetica-Bold').fillColor(COLOR_DARK).text(`Rs. ${halfGst.toLocaleString('en-IN')}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
    currentY += 12;
    doc.font('Helvetica').fillColor(COLOR_MUTED).text('SGST (9% State GST - MH):', summaryX, currentY);
    doc.font('Helvetica-Bold').fillColor(COLOR_DARK).text(`Rs. ${halfGst.toLocaleString('en-IN')}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
    currentY += 12;
  }

  doc.font('Helvetica').fillColor(COLOR_MUTED).text('Total 18% GST (Included in Price):', summaryX, currentY);
  doc.font('Helvetica-Bold').fillColor(COLOR_BURGUNDY).text(`Rs. ${gstEstimated.toLocaleString('en-IN')}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
  currentY += 12;

  if (discountAmount > 0) {
    doc.font('Helvetica').fillColor('#1e824c').text('Privilege Promo Discount:', summaryX, currentY);
    doc.font('Helvetica-Bold').fillColor('#1e824c').text(`- Rs. ${discountAmount.toLocaleString('en-IN')}`, summaryX, currentY, { width: summaryWidth, align: 'right' });
    currentY += 12;
  }

  doc.font('Helvetica').fillColor(COLOR_MUTED).text('Couture Packaging & Shipping:', summaryX, currentY);
  doc.font('Helvetica-Bold').fillColor('#1e824c').text('COMPLIMENTARY', summaryX, currentY, { width: summaryWidth, align: 'right' });
  currentY += 15;

  // Grand Total Highlight Bar
  doc.roundedRect(summaryX - 6, currentY, summaryWidth + 6, 24, 3).fill(COLOR_BURGUNDY);
  doc.rect(summaryX - 6, currentY, 3, 24).fill(COLOR_GOLD); // Gold left bar accent

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff');
  doc.text('TOTAL INVOICE VALUE (INR):', summaryX + 6, currentY + 7);
  doc.text(`Rs. ${subtotal.toLocaleString('en-IN')}`, summaryX, currentY + 7, { width: summaryWidth - 8, align: 'right' });

  currentY += 46;

  // ─── 6. FOOTER & AUTHORIZED DIGITAL SEAL ───────────────────────────────────
  // Terms & Conditions (Left side)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR_BURGUNDY).text('BOUTIQUE TERMS & CARE INSTRUCTIONS:', margin, currentY);
  currentY += 10;
  doc.font('Helvetica').fontSize(6.8).fillColor(COLOR_MUTED);
  doc.text('1. All handcrafted couture ensembles are tailored with bespoke artistry. Professional Dry Clean Only.', margin, currentY);
  doc.text('2. Alteration and fitment requests are honored within 7 days of delivery at our Nagpur atelier.', margin, currentY + 9);
  doc.text('3. This document serves as an authentic Computer-Generated Tax Invoice under Indian GST regulations.', margin, currentY + 18);

  // Digital Signatory Seal Box (Right side)
  const sealWidth = 155;
  const sealX = pageWidth - margin - sealWidth;
  doc.roundedRect(sealX, currentY - 14, sealWidth, 46, 4).fillAndStroke(COLOR_CARD_BG, COLOR_LINE);

  doc.font('Helvetica-Bold').fontSize(7.8).fillColor(COLOR_BURGUNDY).text('FOR SUKO ATELIER', sealX + 8, currentY - 8);
  doc.font('Helvetica').fontSize(6.8).fillColor(COLOR_MUTED).text('Digitally Certified & Approved', sealX + 8, currentY + 3);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(COLOR_GOLD).text('[ OFFICIAL DIGITAL ATELIER SEAL ]', sealX + 8, currentY + 15);

  // Bottom Decorative Gold Bar
  doc.rect(margin, pageHeight - 24, contentWidth, 2.5).fill(COLOR_GOLD);

  doc.end();
};
