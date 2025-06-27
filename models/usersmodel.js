const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
  },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  paymentMethod: {
    type: String,
    enum: ['cash', 'razorpay'],
    required: true,
  },
  paymentHistory: [
    {
      ticketNumber:String,
      paymentId: String,
      amount: Number,
      currency: String,
      status: String,
      method: String,
      createdAt: { type: Date, default: Date.now },
    }
  ]
  ,
  paymentStatus: { type: String},
  amount: { type: Number},
  razorpayOrderId: { type: String },
  createdAt: { type: Date, default: Date.now },
});


ticketSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  try {
    const lastTicket = await this.constructor
      .findOne({ ticketNumber: { $regex: /^TKT\d+$/ } })
      .sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastTicket && lastTicket.ticketNumber) {
      const match = lastTicket.ticketNumber.match(/^TKT(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    this.ticketNumber = 'TKT' + String(nextNumber).padStart(3, '0');

    if (this.paymentMethod === 'cash') {
      this.paymentStatus = 'completed';
    } else {
      this.paymentStatus = 'pending';
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
