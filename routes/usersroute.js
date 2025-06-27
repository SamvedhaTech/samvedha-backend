const express = require('express');
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  exportUsersPDF,
  deleteAllUsers,
  createUserbyadmin,
  verifyPayment,
  exportPaymentHistoryPDF,
  getAllPaymentHistory
} = require('../controllers/userscontroller');

const { authenticate } = require('../protected/authMiddleware');

// User routes
router.post('/', createUser);
router.post('/admin', authenticate, createUserbyadmin);
router.post('/verifyPayment', verifyPayment);

// Specific routes first
router.get('/export/pdf', authenticate, exportUsersPDF);
router.get('/paymenthistory', authenticate, exportPaymentHistoryPDF);
router.get('/payments', authenticate, getAllPaymentHistory);

// Generic routes last
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);
router.delete('/', authenticate, deleteAllUsers);

module.exports = router;
