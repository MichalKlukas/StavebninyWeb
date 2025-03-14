const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/change-password', authController.changePassword);

module.exports = router;
