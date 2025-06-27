const mongoose = require('mongoose');

const amountSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  updatedBy: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Amount', amountSchema); 