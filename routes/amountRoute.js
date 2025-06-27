const express = require('express');
const router = express.Router();
const { authenticate } = require('../protected/authMiddleware');
const {
  getCurrentAmount,
  updateAmount,
  getAmountHistory
} = require('../controllers/amountController');


router.get('/',getCurrentAmount); // Public route to get current amount
router.get('/history', authenticate, getAmountHistory); // Protected route to get amount history
router.put('/', authenticate, updateAmount); // Protected route to update amount

module.exports = router; 