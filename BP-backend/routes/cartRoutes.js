// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// Získání košíku uživatele - chráněná trasa (vyžaduje přihlášení)
router.get('/user/cart', authMiddleware, cartController.getUserCart);

// Uložení košíku uživatele - chráněná trasa
router.post('/user/cart', authMiddleware, cartController.saveUserCart);

// Sloučení anonymního košíku s košíkem uživatele - chráněná trasa
router.post('/user/cart/merge', authMiddleware, cartController.mergeCart);

module.exports = router;
