const PDFDocument = require('pdfkit');

function generateInvoicePDF(order, recipientEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#0b0b0e';
      const textMain = '#1e1e24';
      const accentGold = '#c5a059';

      // --- HEADER ---
      doc
        .fillColor(primaryColor)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('SUKO ATELIER', 40, 40)
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text('HAUTE COUTURE & LUXURY GARMENTS', 40, 66)
        .text('GSTIN: 27SUKOA8899F1Z0 · Official Receipt & Tax Invoice', 40, 78);

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('TAX INVOICE', 400, 40, { align: 'right' })
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#444444')
        .text(`Invoice No: #SUKO-${1000 + order.id}`, 400, 62, { align: 'right' })
        .text(`Date: ${new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}`, 400, 76, { align: 'right' });

      doc.moveTo(40, 100).lineTo(555, 100).strokeColor('#e5e5e7').lineWidth(1).stroke();

      // --- BILL TO / CLIENT DETAILS ---
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#888888')
        .text('BILL TO / CLIENT:', 40, 115)
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(textMain)
        .text(recipientEmail || 'Valued Client', 40, 130)
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#555555')
        .text('Payment Method: Online Card / Razorpay Verified', 40, 145)
        .text('Status: Paid & Confirmed', 40, 160);

      // --- TABLE HEADER ---
      const tableTop = 190;
      doc.rect(40, tableTop, 515, 24).fill('#121216');

      doc
        .fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('GARMENT DESCRIPTION', 50, tableTop + 7)
        .text('SIZE', 280, tableTop + 7)
        .text('QTY', 340, tableTop + 7)
        .text('PRICE', 400, tableTop + 7, { width: 60, align: 'right' })
        .text('TOTAL', 480, tableTop + 7, { width: 65, align: 'right' });

      // --- TABLE ROWS ---
      let y = tableTop + 32;
      const items = order.items || [];

      items.forEach((item, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f9f9fb';
        doc.rect(40, y - 5, 515, 24).fill(bg);

        const productName = item.product?.name || 'Luxe Garment';
        const price = Number(item.price_at_purchase || item.product?.price || 0);
        const itemTotal = price * item.quantity;

        doc
          .fillColor(textMain)
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(productName, 50, y)
          .font('Helvetica')
          .fillColor('#555555')
          .text(item.size || 'STD', 280, y)
          .text(String(item.quantity), 340, y)
          .text(`₹${price.toLocaleString('en-IN')}`, 400, y, { width: 60, align: 'right' })
          .fillColor(primaryColor)
          .font('Helvetica-Bold')
          .text(`₹${itemTotal.toLocaleString('en-IN')}`, 480, y, { width: 65, align: 'right' });

        y += 26;
      });

      doc.moveTo(40, y + 5).lineTo(555, y + 5).strokeColor('#e5e5e7').lineWidth(1).stroke();

      // --- SUMMARY TOTALS ---
      const totalY = y + 20;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#555555')
        .text('Subtotal:', 380, totalY, { width: 80, align: 'right' })
        .text(`₹${Number(order.total).toLocaleString('en-IN')}`, 470, totalY, { width: 75, align: 'right' });

      doc
        .text('Delivery Fee:', 380, totalY + 16, { width: 80, align: 'right' })
        .text('COMPLIMENTARY', 470, totalY + 16, { width: 75, align: 'right' });

      doc.rect(370, totalY + 34, 185, 28).fill('#121216');
      doc
        .fillColor('#ffffff')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('GRAND TOTAL:', 380, totalY + 43)
        .text(`₹${Number(order.total).toLocaleString('en-IN')}`, 470, totalY + 43, { width: 75, align: 'right' });

      // --- FOOTER ---
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#888888')
        .text('This is a computer-generated tax invoice for SUKO Atelier orders. No physical signature is required.', 40, 750, { align: 'center' })
        .text('Thank you for patronizing SUKO Haute Couture.', 40, 764, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePDF };
