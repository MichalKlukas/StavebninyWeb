// controllers/cartController.js
const db = require('../config/db');

const cartController = {
  // Získání košíku uživatele
  async getUserCart(req, res) {
    try {
      const userId = req.user.id;
      
      // Kontrola, zda uživatel existuje
      const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Uživatel nebyl nalezen' });
      }
      
      // Získání položek košíku z databáze
      const cartResult = await db.query(
        `SELECT 
          ci.id, ci.product_id, ci.quantity, 
          p.name, p.price, p.image_url as image, p.price_unit
        FROM 
          cart_items ci
        JOIN 
          products p ON ci.product_id = p.id
        WHERE 
          ci.user_id = $1`,
        [userId]
      );
      
      // Formátování odpovědi
      const items = cartResult.rows.map(item => ({
        id: item.product_id,
        name: item.name,
        price: item.price,
        image: item.image || 'placeholder.jpg',
        quantity: item.quantity,
        priceUnit: item.price_unit
      }));
      
      // Získání způsobu dopravy
      const shippingResult = await db.query(
        'SELECT shipping_method FROM user_preferences WHERE user_id = $1',
        [userId]
      );
      
      let shippingMethod = 'pickup'; // Výchozí hodnota
      if (shippingResult.rows.length > 0 && shippingResult.rows[0].shipping_method) {
        shippingMethod = shippingResult.rows[0].shipping_method;
      }
      
      res.json({ 
        items,
        shippingMethod
      });
    } catch (error) {
      console.error('Chyba při načítání košíku:', error);
      res.status(500).json({ error: 'Při načítání košíku došlo k chybě.' });
    }
  },
  
  // Uložení košíku uživatele
  async saveUserCart(req, res) {
    try {
      const userId = req.user.id;
      const { items, shippingMethod } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Neplatná data košíku.' });
      }
      
      // Zahájení transakce
      await db.query('BEGIN');
      
      // Odstranění stávajících položek košíku
      await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
      
      // Vložení nových položek košíku
      if (items.length > 0) {
        for (const item of items) {
          await db.query(
            'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
            [userId, item.id, item.quantity]
          );
        }
      }
      
      // Uložení způsobu dopravy
      if (shippingMethod) {
        // Kontrola, zda záznam již existuje
        const prefCheck = await db.query(
          'SELECT user_id FROM user_preferences WHERE user_id = $1',
          [userId]
        );
        
        if (prefCheck.rows.length > 0) {
          // Aktualizace existujícího záznamu
          await db.query(
            'UPDATE user_preferences SET shipping_method = $1 WHERE user_id = $2',
            [shippingMethod, userId]
          );
        } else {
          // Vytvoření nového záznamu
          await db.query(
            'INSERT INTO user_preferences (user_id, shipping_method) VALUES ($1, $2)',
            [userId, shippingMethod]
          );
        }
      }
      
      // Potvrzení transakce
      await db.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Košík byl úspěšně uložen.'
      });
    } catch (error) {
      // Rollback při chybě
      await db.query('ROLLBACK');
      console.error('Chyba při ukládání košíku:', error);
      res.status(500).json({ error: 'Při ukládání košíku došlo k chybě.' });
    }
  },
  
  // Sloučení anonymního košíku s košíkem uživatele
  async mergeCart(req, res) {
    try {
      const userId = req.user.id;
      const { items, shippingMethod, anonymousCartId } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Neplatná data košíku.' });
      }
      
      // Získání existujícího košíku uživatele
      const existingCartResult = await db.query(
        `SELECT 
          ci.id, ci.product_id, ci.quantity
        FROM 
          cart_items ci
        WHERE 
          ci.user_id = $1`,
        [userId]
      );
      
      // Vytvoření mapy existujících položek pro rychlejší vyhledávání
      const existingItems = {};
      existingCartResult.rows.forEach(item => {
        existingItems[item.product_id] = item.quantity;
      });
      
      // Zahájení transakce
      await db.query('BEGIN');
      
      // Odstranění stávajících položek košíku
      await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
      
      // Vložení sloučených položek
      const mergedItems = [];
      
      // Procházení položek z anonymního košíku
      for (const item of items) {
        const productId = item.id;
        let quantity = item.quantity;
        
        // Pokud produkt existuje v košíku uživatele, sloučíme množství
        if (existingItems[productId]) {
          quantity += existingItems[productId];
          delete existingItems[productId];
        }
        
        // Vložení položky do databáze
        await db.query(
          'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
          [userId, productId, quantity]
        );
        
        // Přidání do výsledku
        const productResult = await db.query(
          'SELECT name, price, image_url as image, price_unit FROM products WHERE id = $1',
          [productId]
        );
        
        if (productResult.rows.length > 0) {
          const product = productResult.rows[0];
          mergedItems.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image || 'placeholder.jpg',
            quantity: quantity,
            priceUnit: product.price_unit
          });
        }
      }
      
      // Přidání zbývajících položek z košíku uživatele
      for (const [productId, quantity] of Object.entries(existingItems)) {
        if (quantity > 0) {
          // Vložení položky do databáze
          await db.query(
            'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
            [userId, productId, quantity]
          );
          
          // Přidání do výsledku
          const productResult = await db.query(
            'SELECT name, price, image_url as image, price_unit FROM products WHERE id = $1',
            [productId]
          );
          
          if (productResult.rows.length > 0) {
            const product = productResult.rows[0];
            mergedItems.push({
              id: productId,
              name: product.name,
              price: product.price,
              image: product.image || 'placeholder.jpg',
              quantity: quantity,
              priceUnit: product.price_unit
            });
          }
        }
      }
      
      // Uložení způsobu dopravy
      if (shippingMethod) {
        // Kontrola, zda záznam již existuje
        const prefCheck = await db.query(
          'SELECT user_id FROM user_preferences WHERE user_id = $1',
          [userId]
        );
        
        if (prefCheck.rows.length > 0) {
          // Aktualizace existujícího záznamu
          await db.query(
            'UPDATE user_preferences SET shipping_method = $1 WHERE user_id = $2',
            [shippingMethod, userId]
          );
        } else {
          // Vytvoření nového záznamu
          await db.query(
            'INSERT INTO user_preferences (user_id, shipping_method) VALUES ($1, $2)',
            [userId, shippingMethod]
          );
        }
      }
      
      // Potvrzení transakce
      await db.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Košíky byly úspěšně sloučeny.',
        items: mergedItems,
        shippingMethod
      });
    } catch (error) {
      // Rollback při chybě
      await db.query('ROLLBACK');
      console.error('Chyba při slučování košíků:', error);
      res.status(500).json({ error: 'Při slučování košíků došlo k chybě.' });
    }
  }
};

module.exports = cartController;
