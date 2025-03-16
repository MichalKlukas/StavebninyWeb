// Add this to your backend server
// For example in a new file called searchController.js

const db = require('../config/db');

// Search controller
const searchController = {
  async searchProducts(req, res) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      // Convert query to lowercase for case-insensitive search
      const searchTerm = q.toLowerCase();
      console.log(`Searching for products with term: ${searchTerm}`);
      
      // SQL query using ILIKE for case-insensitive partial matching
      // Searching in product name, description, and categories
      const query = `
        SELECT 
          p.id, 
          p.name, 
          p.price, 
          p.image_url as "imageUrl", 
          p.price_unit as "priceUnit",
          c.name as "categoryName",
          sc.name as "subcategoryName"
        FROM 
          products p
        LEFT JOIN 
          categories c ON p.category_id = c.id
        LEFT JOIN 
          subcategories sc ON p.subcategory_id = sc.id
        WHERE 
          LOWER(p.name) ILIKE $1 OR
          LOWER(p.description) ILIKE $1 OR
          LOWER(c.name) ILIKE $1 OR
          LOWER(sc.name) ILIKE $1
        ORDER BY 
          p.name ASC
        LIMIT 50
      `;
      
      // Execute the query with the search term (adding % for partial matching)
      const result = await db.query(query, [`%${searchTerm}%`]);
      
      console.log(`Found ${result.rows.length} products matching "${searchTerm}"`);
      
      // Return the products
      res.status(200).json({
        products: result.rows,
        count: result.rows.length,
        query: q
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Při vyhledávání došlo k chybě.' });
    }
  }
};

module.exports = searchController;
