// userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Endpoint pro získání profilu
router.get('/profile', auth, userController.getProfile);

// Endpoint pro aktualizaci profilu
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
