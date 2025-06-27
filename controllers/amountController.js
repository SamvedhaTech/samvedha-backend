const Amount = require('../models/AmountModel');

exports.getCurrentAmount = async (req, res) => {
  try {
    const amountConfig = await Amount.findOne().sort({ updatedAt: -1 });
    if (!amountConfig) {
      return res.status(404).json({
        success: false,
        message: 'No amount configuration found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Amount fetched successfully',
      amount: amountConfig.amount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching amount',
      error: error.message
    });
  }
};

exports.updateAmount = async (req, res) => {
  try {
    const { amount } = req.body;
    const { email } = req.admin || {}; 

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount greater than 0'
      });
    }

    const updatedAmount = await Amount.findByIdAndUpdate(
      FIXED_AMOUNT_ID,
      {
        _id: FIXED_AMOUNT_ID,
        amount: Number(amount),
        updatedBy: email,
        updatedAt: new Date()
      },
      {
        new: true,
        upsert: true // creates if not exists
      }
    );

    res.status(200).json({
      success: true,
      message: 'Amount updated successfully',
      amount: updatedAmount.amount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating amount',
      error: error.message
    });
  }
};

exports.getAmountHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [history, total] = await Promise.all([
      Amount.find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Amount.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      message: 'Amount history fetched successfully',
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching amount history',
      error: error.message
    });
  }
}; 