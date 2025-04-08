// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Get all products with optional filtering and pagination
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Get distinct categories
router.get('/categories/all', productController.getCategories);

// Get subcategories for a specific category
router.get('/categories/:category/subcategories', productController.getSubcategoriesByCategory);

module.exports = router;
