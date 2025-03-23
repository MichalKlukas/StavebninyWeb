// routes/cartRoutes.js
const express = require('express')
const router = express.Router()
const db = require('../config/db')
const auth = require('../middleware/auth')

// Public status endpoint
router.get('/cart/status', (req, res) => {
  console.log('Cart status endpoint accessed')
  res.json({
    success: true,
    message: 'Cart API is working'
  })
})

// GET /cart - UPDATED to remove JOIN with products table
router.get('/cart', auth, async (req, res) => {
  try {
    const userId = req.user.id
    console.log(`Cart GET: userId=${userId}`)
    
    // Changed query to not use JOIN with products table
    const cartResult = await db.query(`
      SELECT id,
             product_id,
             quantity,
             created_at,
             updated_at
        FROM cart_items
       WHERE user_id = $1
    `, [userId])
    
    console.log(`Cart items found: ${cartResult.rows.length}`)
    if (cartResult.rows.length > 0) {
      console.log(`First item: ${JSON.stringify(cartResult.rows[0])}`)
    }
    
    res.json({ success: true, cartItems: cartResult.rows })
  } catch (error) {
    console.error('Error fetching cart:', error)
    res.status(500).json({ error: 'Nepodařilo se načíst košík' })
  }
})

// POST /cart
router.post('/cart', auth, async (req, res) => {
  try {
    const { productId, quantity, price, name, image, priceUnit } = req.body
    const userId = req.user.id
    
    console.log(`Cart POST: userId=${userId}, productId=${productId}, quantity=${quantity}`)
    
    const existingItem = await db.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    )
    
    console.log(`Existing items found: ${existingItem.rows.length}`)
    
    let result
    if (existingItem.rows.length > 0) {
      const newQuantity = existingItem.rows[0].quantity + (quantity || 1)
      result = await db.query(
        'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [newQuantity, userId, productId]
      )
      console.log(`Updated cart item: ${JSON.stringify(result.rows[0])}`)
    } else {
      result = await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
        [userId, productId, quantity || 1]
      )
      console.log(`Inserted new cart item: ${JSON.stringify(result.rows[0])}`)
    }
    
    res.json({ success: true, cartItem: result.rows[0] })
  } catch (error) {
    console.error('Error adding to cart:', error)
    res.status(500).json({ error: 'Nepodařilo se přidat položku do košíku' })
  }
})

// PUT /cart/:itemId
router.put('/cart/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params
    const { quantity } = req.body
    const userId = req.user.id
    
    console.log(`Cart PUT: itemId=${itemId}, userId=${userId}, quantity=${quantity}`)
    
    const result = await db.query(
      'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, itemId, userId]
    )
    
    if (result.rows.length === 0) {
      console.log(`No cart item found for update: itemId=${itemId}, userId=${userId}`)
      return res.status(404).json({ error: 'Položka košíku nebyla nalezena' })
    }
    
    console.log(`Updated cart item quantity: ${JSON.stringify(result.rows[0])}`)
    res.json({ success: true, cartItem: result.rows[0] })
  } catch (error) {
    console.error('Error updating cart item:', error)
    res.status(500).json({ error: 'Nepodařilo se aktualizovat položku košíku' })
  }
})

// DELETE /cart/:itemId
router.delete('/cart/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params
    const userId = req.user.id
    
    console.log(`Cart DELETE: itemId=${itemId}, userId=${userId}`)
    
    const result = await db.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
      [itemId, userId]
    )
    
    if (result.rows.length === 0) {
      console.log(`No cart item found for deletion: itemId=${itemId}, userId=${userId}`)
      return res.status(404).json({ error: 'Položka košíku nebyla nalezena' })
    }
    
    console.log(`Deleted cart item: ${JSON.stringify(result.rows[0])}`)
    res.json({ success: true })
  } catch (error) {
    console.error('Error removing cart item:', error)
    res.status(500).json({ error: 'Nepodařilo se odstranit položku košíku' })
  }
})

module.exports = router
