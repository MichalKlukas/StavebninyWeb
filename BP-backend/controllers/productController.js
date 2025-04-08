// controllers/productController.js
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

// Get all products with optional pagination and filtering
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 45, category, subcategory, minPrice, maxPrice, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products';
    const queryParams = [];
    let whereClause = [];

    if (category) {
      whereClause.push(`category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }
    if (subcategory) {
      whereClause.push(`subcategory = $${queryParams.length + 1}`);
      queryParams.push(subcategory);
    }
    if (minPrice) {
      whereClause.push(`price >= $${queryParams.length + 1}`);
      queryParams.push(minPrice);
    }
    if (maxPrice) {
      whereClause.push(`price <= $${queryParams.length + 1}`);
      queryParams.push(maxPrice);
    }
    if (search) {
      whereClause.push(`name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (whereClause.length > 0) {
      query += ' WHERE ' + whereClause.join(' AND ');
    }

    query += ` ORDER BY id LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows } = await pool.query(query, queryParams);

    // For each product, check if the image file exists; if not, set image_url to null
    const productsWithImages = rows.map(product => {
      if (product.image_url) {
        // Create the full filesystem path for the image
        const imageFullPath = path.join('/var/www/html', product.image_url);
        if (!fs.existsSync(imageFullPath)) {
          // File doesn't exist, so set to null to trigger the frontend fallback
          product.image_url = null;
        }
      }
      return {
        ...product,
        image_url: product.image_url || null
      };
    });

    // Count total products for pagination metadata
    let countQuery = 'SELECT COUNT(*) FROM products';
    if (whereClause.length > 0) {
      countQuery += ' WHERE ' + whereClause.join(' AND ');
    }
    const countResult = await pool.query(countQuery, queryParams.slice(0, whereClause.length));
    const totalProducts = parseInt(countResult.rows[0].count);

    res.status(200).json({
      status: 'success',
      results: productsWithImages.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
      data: {
        products: productsWithImages
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Could not retrieve products'
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    let product = { ...rows[0] };
    if (product.image_url) {
      const imageFullPath = path.join('/var/www/html', product.image_url);
      if (!fs.existsSync(imageFullPath)) {
        product.image_url = null;
      }
    }

    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    console.error('Error getting product by ID:', error);
    res.status(500).json({
      status: 'error',
      message: 'Could not retrieve product'
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category');
    res.status(200).json({
      status: 'success',
      data: {
        categories: rows.map(row => row.category)
      }
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      status: 'error',
      message: 'Could not retrieve categories'
    });
  }
};

const getSubcategoriesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { rows } = await pool.query(
      'SELECT DISTINCT subcategory FROM products WHERE category = $1 AND subcategory IS NOT NULL ORDER BY subcategory',
      [category]
    );
    res.status(200).json({
      status: 'success',
      data: {
        subcategories: rows.map(row => row.subcategory)
      }
    });
  } catch (error) {
    console.error('Error getting subcategories:', error);
    res.status(500).json({
      status: 'error',
      message: 'Could not retrieve subcategories'
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getCategories,
  getSubcategoriesByCategory
};

