const express = require('express');
const router = express.Router();
const {adminLogin,registerAdmin,changePassword} = require('../controllers/authController');
const { authenticate } = require('../protected/authMiddleware');

router.post('/register',registerAdmin);
router.post('/login',adminLogin);
router.post('/resetpassword',authenticate,changePassword);


module.exports = router;