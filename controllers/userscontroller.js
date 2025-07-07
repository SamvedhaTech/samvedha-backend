const User = require('../models/usersmodel');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { sendInteractiveEmail } = require('../utils/sendEmail');
require('pdfkit-table');
const Amount = require('../models/AmountModel');
const generateReceiptPDF = require('../utils/generateReceipt');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



exports.createUser = async (req, res) => {
  try {
    const {
      name, email, phone,
      currency = 'INR',
      paymentMethod, paymentStatus = paymentMethod === 'cash' ? 'completed' : 'pending',
    } = req.body;

    if (!name || !phone || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phone, or payment method.',
      });
    }

    // Fetch latest amount from Amount model
    const amountConfig = await Amount.findOne().sort({ updatedAt: -1 });
    const amount = amountConfig ? amountConfig.amount : null;
    if (!amount) {
      return res.status(500).json({
        success: false,
        message: 'No payment amount configured. Please set an amount in the admin panel.',
      });
    }

    const normalizedEmail = email?.toLowerCase();
    const normalizedPhone = phone.trim();

    try {
      const [existingEmailUser, existingPhoneUser] = await Promise.all([
        email ? User.findOne({ email: normalizedEmail }).lean() : null,
        User.findOne({ phone: normalizedPhone }).lean(),
      ]);

      if (existingEmailUser && email) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists.',
        });
      }

      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with this phone number already exists.',
        });
      }

      const ticket = new User({
        name,
        email: normalizedEmail,
        phone: normalizedPhone,
        amount,
        paymentMethod,
        paymentStatus,
      });

      await ticket.save();
      const receiptUrl = await generateReceiptPDF(ticket);

      if (paymentMethod === 'razorpay') {
        try {
          const amountInPaise = Math.round(amount * 100);

          if (isNaN(amountInPaise) || amountInPaise <= 0) {
            throw new Error('Invalid amount for Razorpay payment');
          }

          const options = {
            amount: amountInPaise,
            currency,
            receipt: `receipt_${ticket.ticketNumber}`,
            payment_capture: 1,
          };

          console.log('Creating Razorpay order with options:', options);

          const razorpayOrder = await razorpay.orders.create(options);

          if (!razorpayOrder || !razorpayOrder.id) {
            throw new Error('Failed to create Razorpay order');
          }

          ticket.razorpayOrderId = razorpayOrder.id;
          await ticket.save();

          return res.status(201).json({
            success: true,
            message: 'Ticket created and Razorpay order generated.',
            ticket: ticket.toObject(),
            razorpayOrder: {
              id: razorpayOrder.id,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
            },
          });
        } catch (razorpayError) {
          console.error('Razorpay order creation error:', razorpayError);

          ticket.paymentStatus = 'failed';
          ticket.paymentHistory.push({
            ticketNumber: ticket.ticketNumber,
            paymentId: `failed-${Date.now()}`,
            amount,
            currency,
            status: 'failed',
            method: 'razorpay',
            error: razorpayError.message,
          });
          await ticket.save();

          await sendInteractiveEmail({
            email: ticket.email,
            name: ticket.name,
            amount,
            paymentMethod,
            ticketNumber: ticket.ticketNumber,
            receiptUrl,
            type: 'payment-failed'
          });

          return res.status(500).json({
            success: false,
            message: 'Ticket created but failed to create Razorpay order.',
            error: razorpayError.message,
          });
        }
      }

      // For cash payments
      ticket.paymentHistory.push({
        ticketNumber: ticket.ticketNumber,
        paymentId: `cash-${Date.now()}`,
        amount,
        currency,
        status: 'completed',
        method: 'cash',
      });

      await ticket.save();

      await sendInteractiveEmail({
        email: ticket.email,
        name: ticket.name,
        amount,
        paymentMethod,
        ticketNumber: ticket.ticketNumber,
        receiptUrl,
        type: 'payment-confirmation'
      });

      return res.status(201).json({
        success: true,
        message: 'Ticket created with cash payment.',
        ticket: ticket.toObject(),
      });

    } catch (error) {
      console.error('Ticket creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating ticket',
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Ticket creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ticket',
      error: error.message,
    });
  }
};


exports.createUserbyadmin = async (req, res) => {
  try {
    const {
      name, email, phone,
      currency = 'INR',
      paymentMethod, paymentStatus = paymentMethod === 'cash' ? 'completed' : 'pending',
    } = req.body;

    if (!name || !phone || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phone, or payment method.',
      });
    }

    // Fetch latest amount from Amount model
    const amountConfig = await Amount.findOne().sort({ updatedAt: -1 });
    const amount = amountConfig ? amountConfig.amount : null;
    if (!amount) {
      return res.status(500).json({
        success: false,
        message: 'No payment amount configured. Please set an amount in the admin panel.',
      });
    }

    const normalizedEmail = email?.toLowerCase();
    const normalizedPhone = phone.trim();

    try {
      const [existingEmailUser, existingPhoneUser] = await Promise.all([
        email ? User.findOne({ email: normalizedEmail }).lean() : null,
        User.findOne({ phone: normalizedPhone }).lean(),
      ]);

      if (existingEmailUser && email) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists.',
        });
      }

      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with this phone number already exists.',
        });
      }

      const ticket = new User({
        name,
        email: normalizedEmail,
        phone: normalizedPhone,
        amount,
        paymentMethod,
        paymentStatus,
      });

      await ticket.save();
      const receiptUrl = await generateReceiptPDF(ticket);

      if (paymentMethod === 'razorpay') {
        try {
          const amountInPaise = Math.round(amount * 100);

          if (isNaN(amountInPaise) || amountInPaise <= 0) {
            throw new Error('Invalid amount for Razorpay payment');
          }

          const options = {
            amount: amountInPaise,
            currency,
            receipt: `receipt_${ticket.ticketNumber}`,
            payment_capture: 1,
          };

          console.log('Creating Razorpay order with options:', options);

          const razorpayOrder = await razorpay.orders.create(options);

          if (!razorpayOrder || !razorpayOrder.id) {
            throw new Error('Failed to create Razorpay order');
          }

          ticket.razorpayOrderId = razorpayOrder.id;
          await ticket.save();

          return res.status(201).json({
            success: true,
            message: 'Ticket created and Razorpay order generated.',
            ticket: ticket.toObject(),
            razorpayOrder: {
              id: razorpayOrder.id,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
            },
          });
        } catch (razorpayError) {
          console.error('Razorpay order creation error:', razorpayError);

          ticket.paymentStatus = 'failed';
          ticket.paymentHistory.push({
            ticketNumber: ticket.ticketNumber,
            paymentId: `failed-${Date.now()}`,
            amount,
            currency,
            status: 'failed',
            method: 'razorpay',
            error: razorpayError.message,
          });
          await ticket.save();

          await sendInteractiveEmail({
            email: ticket.email,
            name: ticket.name,
            amount,
            paymentMethod,
            ticketNumber: ticket.ticketNumber,
            receiptUrl,
            type: 'payment-failed'
          });

          return res.status(500).json({
            success: false,
            message: 'Ticket created but failed to create Razorpay order.',
            error: razorpayError.message,
          });
        }
      }

      // For cash payments
      ticket.paymentHistory.push({
        ticketNumber: ticket.ticketNumber,
        paymentId: `cash-${Date.now()}`,
        amount,
        currency,
        status: 'completed',
        method: 'cash',
      });

      await ticket.save();

      await sendInteractiveEmail({
        email: ticket.email,
        name: ticket.name,
        amount,
        paymentMethod,
        ticketNumber: ticket.ticketNumber,
        receiptUrl,
        type: 'payment-confirmation'
      });

      return res.status(201).json({
        success: true,
        message: 'Ticket created with cash payment.',
        ticket: ticket.toObject(),
      });

    } catch (error) {
      console.error('Ticket creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating ticket',
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Ticket creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ticket',
      error: error.message,
    });
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters',
      });
    }

    const user = await User.findOne({
      razorpayOrderId: orderId,
      paymentStatus: 'pending'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No pending payment found with this order ID',
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      await User.findByIdAndUpdate(user._id, {
        $push: {
          paymentHistory: {
            paymentId: razorpayPaymentId,
            amount: user.amount,
            currency: 'INR',
            status: 'failed',
            method: 'razorpay',
            error: 'Invalid signature',
            createdAt: new Date()
          }
        }
      });

      // Send payment failed email
      await sendInteractiveEmail({
        email: user.email,
        name: user.name,
        amount: user.amount,
        paymentMethod: 'razorpay',
        ticketNumber: user.ticketNumber,
        type: 'payment-failed'
      });

      return res.status(401).json({
        success: false,
        message: 'Payment verification failed - invalid signature',
      });
    }

    user.paymentStatus = 'completed';
    user.razorpayPaymentId = razorpayPaymentId;
    user.paidAt = new Date();
    user.paymentHistory.push({
      paymentId: razorpayPaymentId,
      amount: user.amount,
      currency: 'INR',
      status: 'completed',
      method: 'razorpay',
      createdAt: new Date(),
    });

    await user.save();

    // Send payment success email
    await sendInteractiveEmail({
      email: user.email,
      name: user.name,
      amount: user.amount,
      paymentMethod: 'razorpay',
      ticketNumber: user.ticketNumber,
      paymentId: razorpayPaymentId,
      type: 'payment-success'
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and completed successfully',
      paymentDetails: {
        paymentId: razorpayPaymentId,
        orderId,
        amount: user.amount,
        currency: 'INR',
        status: 'completed',
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      },
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message,
    });
  }
};


exports.getUsers = async (req, res) => {
  try {
    let { paymentStatus, search, page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (search && search.trim() !== "") {
      const searchTerm = search.trim();
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};


exports.exportUsersPDF = async (req, res) => {
  try {
    const { paymentStatus, format } = req.query;

    const query = {};
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    if (format !== "pdf") {
      const tableData = [
        [
          "Name",
          "Email",
          "Phone",
          "Payment Status",
          "Amount",
          "Payment Method",
          "Ticket No",
          "Created At",
        ],
        ...users.map((u) => [
          u.name,
          u.email,
          u.phone,
          u.paymentStatus,
          u.amount,
          u.paymentMethod,
          u.ticketNumber,
          u.createdAt.toLocaleString(),
        ]),
      ];

      return res.status(200).json({
        success: true,
        data: tableData,
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=users_report.pdf");

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text("User Report", { align: "center" });
    doc.moveDown();

    const tableData = {
      headers: [
        "Name",
        "Email",
        "Phone",
        "Payment Status",
        "Amount",
        "Payment Method",
        "Ticket No",
        "Created At",
      ],
      rows: users.map((u) => [
        u.name,
        u.email,
        u.phone,
        u.paymentStatus,
        u.amount?.toString() || "",
        u.paymentMethod,
        u.ticketNumber,
        u.createdAt.toLocaleString(),
      ]),
    };

    await doc.table(tableData, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(12),
      prepareRow: (row, i) => doc.font("Helvetica").fontSize(10),
      columnSpacing: 10,
      padding: 5,
      width: 520,
    });

    doc.end();
  } catch (error) {
    console.error("Error exporting users PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export users",
      error: error.message,
    });
  }
};

// 3️⃣ Export Payment History as JSON or PDF
exports.exportPaymentHistoryPDF = async (req, res) => {
  try {
    const { paymentStatus, format } = req.query;

    const query = {};
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    if (format !== "pdf") {
      const tableData = [
        [
          "Name",
          "Email",
          "Phone",
          "Payment Status",
          "Amount",
          "Payment Method",
          "Ticket No",
          "Created At",
        ],
        ...users.map((u) => [
          u.name,
          u.email,
          u.phone,
          u.paymentStatus,
          u.amount,
          u.paymentMethod,
          u.ticketNumber,
          u.createdAt.toLocaleString(),
        ]),
      ];

      return res.status(200).json({
        success: true,
        data: tableData,
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=payment_history_report.pdf");

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text("Payment History Report", { align: "center" });
    doc.moveDown();

    const tableData = {
      headers: [
        "Name",
        "Email",
        "Phone",
        "Payment Status",
        "Amount",
        "Payment Method",
        "Ticket No",
        "Created At",
      ],
      rows: users.map((u) => [
        u.name,
        u.email,
        u.phone,
        u.paymentStatus,
        u.amount?.toString() || "",
        u.paymentMethod,
        u.ticketNumber,
        u.createdAt.toLocaleString(),
      ]),
    };

    await doc.table(tableData, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(12),
      prepareRow: (row, i) => doc.font("Helvetica").fontSize(10),
      columnSpacing: 10,
      padding: 5,
      width: 520,
    });

    doc.end();
  } catch (error) {
    console.error("Error exporting payment history PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export payment history",
      error: error.message,
    });
  }
};

exports.razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const razorpaySignature = req.headers['x-razorpay-signature'];
  const body = req.body;

  const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');

  if (razorpaySignature !== expectedSignature) {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  try {
    const payment = body.payload.payment.entity;
    const { order_id, id: payment_id, amount, currency, status, method } = payment;

    const user = await User.findOne({ razorpayOrderId: order_id });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.paymentStatus = 'paid';
    user.razorpayPaymentId = payment_id;
    user.paidAt = new Date();

    // Push to payment history
    user.paymentHistory.push({
      paymentId: payment_id,
      amount: amount / 100, // convert paise to INR
      currency,
      status,
      method,
      createdAt: new Date(),
    });

    await user.save();

    res.status(200).json({ success: true, message: 'Payment verified and user updated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};
exports.getAllPaymentHistory = async (req, res) => {
  try {
    const { search, method, status, fromDate, toDate, page = 1, limit = 10 } = req.query;

    let query = {
      paymentHistory: { $exists: true, $not: { $size: 0 } }
    };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { ticketNumber: searchRegex }
      ];
    }

    if (method) {
      query['paymentHistory.method'] = method;
    }

    if (fromDate || toDate) {
      const dateQuery = {};
      if (fromDate) dateQuery.$gte = new Date(fromDate);
      if (toDate) dateQuery.$lte = new Date(toDate);
      query['paymentHistory.createdAt'] = dateQuery;
    }

    if (status) {
      query['paymentHistory.status'] = status;
    }

    const tickets = await User.find(query).lean();

    const filteredHistory = tickets.flatMap(ticket =>
      ticket.paymentHistory
        .filter(payment => {
          if (method && payment.method !== method) return false;
          if (status && payment.status !== status) return false;
          if (fromDate || toDate) {
            const created = new Date(payment.createdAt);
            if (fromDate && created < new Date(fromDate)) return false;
            if (toDate && created > new Date(toDate)) return false;
          }
          return true;
        })
        .map(payment => ({
          ticketId: ticket._id,
          name: ticket.name,
          email: ticket.email,
          phone: ticket.phone,
          method: payment.method,
          amount: payment.amount,
          status: payment.status,
          ticketNumber: ticket.ticketNumber,
          createdAt: payment.createdAt
        }))
    );

    // ✅ Sort by createdAt descending (latest first)
    filteredHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = filteredHistory.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Payment history fetched successfully.',
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      paymentHistory: paginatedHistory
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User fetched successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Removed 'amount' from allowedUpdates
    const allowedUpdates = ['name', 'email', 'phone', 'paymentStatus'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.email) updates.email = updates.email.toLowerCase().trim();
    if (updates.phone) updates.phone = updates.phone.trim();

    const updated = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User updated successfully', updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
  }
};

exports.deleteAllUsers = async (req, res) => {
  try {
    const result = await User.deleteMany({});

    res.status(200).json({
      success: true,
      message: 'All users deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting all users',
      error: error.message,
    });
  }
};