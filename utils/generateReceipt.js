// utils/generateReceipt.js
const PDFDocument = require('pdfkit');
const fs = require('fs'); // Standard fs for createWriteStream
const fsPromises = require('fs').promises; // Promises for async operations
const path = require('path');

async function generateReceiptPDF(user) {
  try {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const receiptFileName = `receipt_${user._id}_${Date.now()}.pdf`;
    const receiptDir = '/tmp/receipts'; // Use /tmp/receipts for Vercel
    const receiptPath = path.join(receiptDir, receiptFileName);

    // Create receipts directory in /tmp
    await fsPromises.mkdir(receiptDir, { recursive: true });

    // Use standard fs for createWriteStream
    const writeStream = fs.createWriteStream(receiptPath);
    doc.pipe(writeStream);

    // === COLORS & STYLE ===
    const primary = '#1E3A8A'; // Deep Blue
    const secondary = '#1F2937'; // Dark Gray
    const accent = '#3B82F6'; // Light Blue
    const gray = '#6B7280'; // Medium Gray
    const bgLight = '#F3F4F6'; // Light Background

    // === HEADER ===
    doc
      .rect(0, 0, doc.page.width, 80)
      .fill(bgLight)
      .fillColor(primary)
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('Payment Receipt', 50, 30, { align: 'left' })
      .fillColor(gray)
      .fontSize(12)
      .text('Samvedha Digital', 50, 55, { align: 'left' });

    doc.moveDown(2);

    // === USER GREETING ===
    doc
      .fillColor(secondary)
      .fontSize(14)
      .font('Helvetica')
      .text(`Dear ${user.name},`, { align: 'left' })
      .moveDown(0.5)
      .fontSize(12)
      .text(`Thank you for your payment of ₹${user.amount.toFixed(2)} via ${user.paymentMethod}.`, {
        align: 'left',
      })
      .moveDown(1.5);

    // === TICKET BOX ===
    const boxTopY = doc.y;
    const boxHeight = 100;
    const boxLeft = 50;
    const boxWidth = doc.page.width - 100;

    doc
      .rect(boxLeft, boxTopY, boxWidth, boxHeight)
      .fillOpacity(0.2)
      .fill(bgLight)
      .strokeColor(accent)
      .lineWidth(2)
      .stroke()
      .fillOpacity(1);

    doc
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('Ticket Number:', boxLeft + 20, boxTopY + 20)
      .fontSize(24)
      .text(`${user.ticketNumber}`, boxLeft + 20, boxTopY + 45);

    doc.moveDown(4);

    // === PAYMENT DETAILS ===
    doc
      .fillColor(secondary)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('Payment Details', { underline: true })
      .moveDown(0.8);

    const detailLabels = [
      ['Amount Paid:', `₹${user.amount.toFixed(2)}`],
      ['Payment Method:', user.paymentMethod.charAt(0).toUpperCase() + user.paymentMethod.slice(1)],
      ['Date:', new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })],
      ['Time:', new Date().toLocaleTimeString('en-IN', { timeStyle: 'medium' })],
      ['Status:', user.paymentStatus.charAt(0).toUpperCase() + user.paymentStatus.slice(1)],
    ];

    const labelX = 70;
    const valueX = 250;

    detailLabels.forEach(([label, value]) => {
      const currentY = doc.y;
      doc
        .fillColor(gray)
        .font('Helvetica')
        .fontSize(12)
        .text(label, labelX, currentY);
      doc
        .fillColor(secondary)
        .font('Helvetica-Bold')
        .text(value, valueX, currentY);
      doc.moveDown(0.5);
    });

    // === FOOTER ===
    doc
      .moveDown(3)
      .fontSize(10)
      .fillColor(gray)
      .text(
        'For any inquiries, please contact our support team at support@samvedhadigital.com',
        { align: 'center' }
      )
      .text(`© ${new Date().getFullYear()} Samvedha Digital. All rights reserved.`, {
        align: 'center',
      });

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        resolve({ publicURL: receiptPath, receiptPath }); // publicURL is receiptPath for Vercel
      });
      writeStream.on('error', (err) => {
        console.error('PDF write stream error:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

module.exports = generateReceiptPDF;