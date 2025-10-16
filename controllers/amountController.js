const Amount = require("../models/AmountModel");

exports.getCurrentAmount = async (req, res) => {
  try {
    const amountConfig = await Amount.findOne().sort({ updatedAt: -1 });
    if (!amountConfig) {
      return res.status(404).json({
        success: false,
        message: "No amount configuration found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Amount fetched successfully",
      amount: amountConfig.amount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching amount",
      error: error.message,
    });
  }
};

exports.updateAmount = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid amount greater than 0",
      });
    }

    const existingAmount = await Amount.findOne().sort({ updatedAt: -1 });

    let updatedAmount;

    if (existingAmount) {
      // Update the existing amount
      updatedAmount = await Amount.findByIdAndUpdate(
        existingAmount._id,
        {
          amount: Number(amount),
          updatedAt: new Date(),
        },
        { new: true }
      );
    } else {
      // Create new amount configuration
      updatedAmount = await Amount.create({
        amount: Number(amount),
        updatedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: "Amount updated successfully",
      amount: updatedAmount.amount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating amount",
      error: error.message,
    });
  }
};


exports.getAmountHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [history, total] = await Promise.all([
      Amount.find().sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)),
      Amount.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      message: "Amount history fetched successfully",
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching amount history",
      error: error.message,
    });
  }
};