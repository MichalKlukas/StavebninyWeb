const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth'); // Import the auth middleware

// Login route
router.post('/login', (req, res) => {
  console.log('Login route accessed');
  authController.login(req, res);
});
// Verify reset token route
router.get('/verify-reset-token/:token', (req, res) => {
  console.log('Verify reset token route accessed');
  authController.verifyResetToken(req, res);
});


// Register route
router.post('/register', (req, res) => {
  console.log('Register route accessed');
  authController.register(req, res);
});

// Verify email route
router.get('/verify-email/:token', (req, res) => {
  console.log('Verify email route accessed');
  authController.verifyEmail(req, res);
});

// Forgot password route
router.post('/forgot-password', (req, res) => {
  console.log('Forgot password route accessed');
  authController.forgotPassword(req, res);
});

// Reset password route
router.post('/reset-password/:token', (req, res) => {
  console.log('Reset password route accessed');
  authController.resetPassword(req, res);
});

// Change password route - now with auth middleware
router.post('/change-password', auth, (req, res) => {
  console.log('Change password route accessed');
  authController.changePassword(req, res);
});

module.exports = router;
