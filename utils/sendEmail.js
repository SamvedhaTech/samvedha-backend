// utils/emailTemplates.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
});

const sendInteractiveEmail = async ({
  email,
  name,
  amount,
  paymentMethod,
  ticketNumber,
  type,
  paymentId,
  receiptUrl
}) => {
  let subject, html;

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const paymentMethodMap = {
    'razorpay': 'Razorpay',
    'cash': 'Cash',
    'bank_transfer': 'Bank Transfer',
    'card': 'Credit/Debit Card'
  };

  const paymentMethodText = paymentMethodMap[paymentMethod] || paymentMethod;

  switch (type) {
    case 'payment-initiated':
      subject = `Payment Initiated - Your Ticket #${ticketNumber}`;
      html = getPaymentInitiatedTemplate(name, amount, paymentMethodText, ticketNumber, formattedDate);
      break;
    case 'payment-success':
      subject = `Payment Successful - Your Ticket #${ticketNumber}`;
      html = getPaymentSuccessTemplate(name, amount, paymentMethodText, ticketNumber, paymentId, formattedDate, formattedTime,receiptUrl);
      break;
    case 'payment-confirmation':
      subject = `Payment Confirmed - Your Ticket #${ticketNumber}`;
      html = getPaymentConfirmationTemplate(name, amount, paymentMethodText, ticketNumber, formattedDate, formattedTime);
      break;
    case 'payment-failed':
      subject = `Payment Failed - Your Ticket #${ticketNumber}`;
      html = getPaymentFailedTemplate(name, amount, ticketNumber, formattedDate);
      break;
    default:
      subject = `Payment Update - Your Ticket #${ticketNumber}`;
      html = getDefaultTemplate(name, amount, ticketNumber);
  }

  const mailOptions = {
    from: `"Samvedhadigital" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email} for ${type}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    throw error;
  }
};

// Template generators
const getPaymentInitiatedTemplate = (name, amount, paymentMethod, ticketNumber, date) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Initiated</title>
      ${getCommonStyles()}
    </head>
    <body>
      ${getEmailHeader('Payment Initiated')}
      
      <div class="content">
        <p>Dear ${name},</p>
        <p>We've received your payment request for ₹${amount} via ${paymentMethod}.</p>
        
        ${getTicketCard(ticketNumber)}
        
        <div class="payment-details">
          <table>
            <tr>
              <td>Amount:</td>
              <td>₹${amount}</td>
            </tr>
            <tr>
              <td>Payment Method:</td>
              <td>${paymentMethod}</td>
            </tr>
            <tr>
              <td>Date:</td>
              <td>${date}</td>
            </tr>
            <tr>
              <td>Status:</td>
              <td class="status-pending">Pending</td>
            </tr>
          </table>
        </div>
        
        <p>Please complete your payment to confirm your ticket. You'll receive another email once your payment is successful.</p>
        
        ${getSupportInfo()}
      </div>
      
      ${getEmailFooter()}
    </body>
    </html>
  `;
};

const getPaymentSuccessTemplate = (name, amount, paymentMethod, ticketNumber, paymentId, date, time,receiptUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
      ${getCommonStyles()}
      <style>
        .status-completed {
          color: #10b981;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      ${getEmailHeader('Payment Successful! 🎉')}
      
      <div class="content">
        <p>Dear ${name},</p>
        <p>Your payment of ₹${amount} has been successfully processed!</p>
        
        ${getTicketCard(ticketNumber)}
        
        <div class="payment-details">
          <table>
            <tr>
              <td>Amount Paid:</td>
              <td>₹${amount}</td>
            </tr>
            <tr>
              <td>Payment Method:</td>
              <td>${paymentMethod}</td>
            </tr>
            <tr>
              <td>Transaction ID:</td>
              <td>${paymentId}</td>
            </tr>
            <tr>
              <td>Date:</td>
              <td>${date}</td>
            </tr>
            <tr>
              <td>Time:</td>
              <td>${time}</td>
            </tr>
            <tr>
              <td>Status:</td>
              <td class="status-completed">Completed</td>
            </tr>
          </table>
        </div>
        
        ${receiptUrl ? `<a href="${receiptUrl}" class="button" target="_blank">Download Receipt</a>` : ''}
        <p>Your ticket is now confirmed. Please present this ticket number at the venue.</p>
        
        ${getSupportInfo()}
      </div>
      
      ${getEmailFooter()}
    </body>
    </html>
  `;
};

const getPaymentConfirmationTemplate = (name, amount, paymentMethod, ticketNumber, date, time) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmed</title>
      ${getCommonStyles()}
      <style>
        .status-completed {
          color: #10b981;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      ${getEmailHeader('Payment Confirmed! ✅')}
      
      <div class="content">
        <p>Dear ${name},</p>
        <p>Thank you for your payment of ₹${amount} via ${paymentMethod}.</p>
        
        ${getTicketCard(ticketNumber)}
        
        <div class="payment-details">
          <table>
            <tr>
              <td>Amount Paid:</td>
              <td>₹${amount}</td>
            </tr>
            <tr>
              <td>Payment Method:</td>
              <td>${paymentMethod}</td>
            </tr>
            <tr>
              <td>Date:</td>
              <td>${date}</td>
            </tr>
            <tr>
              <td>Time:</td>
              <td>${time}</td>
            </tr>
            <tr>
              <td>Status:</td>
              <td class="status-completed">Confirmed</td>
            </tr>
          </table>
        </div>
        
        <a href="#" class="button">View Ticket Details</a>
        
        <p>Your ticket is now confirmed. Please keep this email for your records.</p>
        
        ${getSupportInfo()}
      </div>
      
      ${getEmailFooter()}
    </body>
    </html>
  `;
};

const getPaymentFailedTemplate = (name, amount, ticketNumber, date) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed</title>
      ${getCommonStyles()}
      <style>
        .status-failed {
          color: #ef4444;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      ${getEmailHeader('Payment Failed')}
      
      <div class="content">
        <p>Dear ${name},</p>
        <p>We regret to inform you that your payment of ₹${amount} could not be processed.</p>
        
        ${getTicketCard(ticketNumber)}
        
        <div class="payment-details">
          <table>
            <tr>
              <td>Amount:</td>
              <td>₹${amount}</td>
            </tr>
            <tr>
              <td>Date:</td>
              <td>${date}</td>
            </tr>
            <tr>
              <td>Status:</td>
              <td class="status-failed">Failed</td>
            </tr>
          </table>
        </div>
        
        <a href="#" class="button">Retry Payment</a>
        
        <p>Please try again or contact our support team if you need assistance.</p>
        
        ${getSupportInfo()}
      </div>
      
      ${getEmailFooter()}
    </body>
    </html>
  `;
};

// Reusable components
const getCommonStyles = () => `
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f7f7f7;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #4f46e5;
      color: white;
      padding: 25px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 25px;
    }
    .ticket-card {
      background-color: #f0f9ff;
      border-left: 4px solid #4f46e5;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .ticket-number {
      font-size: 20px;
      font-weight: bold;
      color: #4f46e5;
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white !important;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 4px;
      font-weight: bold;
      margin: 15px 0;
      text-align: center;
    }
    .payment-details {
      background-color: #f8fafc;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
    }
    .payment-details table {
      width: 100%;
      border-collapse: collapse;
    }
    .payment-details td {
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .payment-details td:last-child {
      text-align: right;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 15px;
      }
      .header h1 {
        font-size: 20px;
      }
    }
  </style>
`;

const getEmailHeader = (title) => `
  <div class="email-container">
    <div class="header">
      <h1>${title}</h1>
    </div>
`;

const getTicketCard = (ticketNumber) => `
  <div class="ticket-card">
    <p>Your Ticket Number:</p>
    <div class="ticket-number">${ticketNumber}</div>
    <p>Please keep this number safe for your records.</p>
  </div>
`;

const getSupportInfo = () => `
  <p>If you have any questions, please contact our support team at 
    <a href="mailto:support@samvedhadigital.com">support@samvedhadigital.com</a> 
    or call us at [Support Phone Number].</p>
`;

const getEmailFooter = () => `
  <div class="footer">
    <p>©️ ${new Date().getFullYear()} Samvedhadigital. All rights reserved.</p>
    <p>Address: [Your Company Address]</p>
  </div>
</div>
`;

module.exports = { sendInteractiveEmail };
