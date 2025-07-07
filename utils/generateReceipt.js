// utils/generateReceiptPDF.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generateReceiptPDF(user) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const receiptFileName = `receipt_${user._id}_${Date.now()}.pdf`;
    const receiptDir = path.join(__dirname, '..', 'public', 'receipts');

    // Ensure receipts directory exists
    fs.mkdirSync(receiptDir, { recursive: true });

    const receiptPath = path.join(receiptDir, receiptFileName);
    const writeStream = fs.createWriteStream(receiptPath);
    doc.pipe(writeStream);

    // === HEADER ===
    doc
      .fillColor('#4f46e5')
      .fontSize(24)
      .text('Payment Confirmed! ✅', { align: 'center' })
      .moveDown(1);

    // === Ticket Card ===
    doc
      .fillColor('#333')
      .fontSize(12)
      .text(`Dear ${user.name},`)
      .moveDown(0.5)
      .text(`Thank you for your payment of ₹${user.amount} via ${user.paymentMethod}.`)
      .moveDown(1);

    doc
      .rect(doc.x, doc.y, doc.page.width - 100, 70)
      .fillOpacity(0.1)
      .fill('#f0f9ff')
      .strokeColor('#4f46e5')
      .lineWidth(2)
      .stroke()
      .fillOpacity(1);

    doc
      .fillColor('#4f46e5')
      .fontSize(16)
      .text('Your Ticket Number:', doc.x + 10, doc.y - 60)
      .fontSize(20)
      .text(`${user.ticketNumber}`, { continued: false })
      .moveDown(1);

    // === Payment Details Table ===
    const startY = doc.y;
    const tableLeft = 50;
    const tableWidth = doc.page.width - 100;

    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#333').text('Payment Details:', { underline: true });
    doc.moveDown(0.5);

    const details = [
      ['Amount Paid:', `₹${user.amount}`],
      ['Payment Method:', user.paymentMethod],
      ['Date:', new Date().toLocaleDateString('en-IN')],
      ['Time:', new Date().toLocaleTimeString('en-IN')],
      ['Status:', user.paymentStatus === 'paid' ? 'Confirmed' : user.paymentStatus],
    ];

    details.forEach(([label, value]) => {
      doc.fillColor('#333').text(label, { continued: true }).text(` ${value}`, { align: 'right' });
    });

    doc.moveDown(1);

    // === Footer Support Info ===
    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text('If you have any questions, please contact our support team at support@samvedhadigital.com', {
        align: 'center',
      })
      .text(`© ${new Date().getFullYear()} Samvedhadigital. All rights reserved.`, {
        align: 'center',
      });

    doc.end();

    writeStream.on('finish', () => {
      const publicURL = `${process.env.BASE_URL}/receipts/${receiptFileName}`;
      resolve(publicURL);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = generateReceiptPDF;
