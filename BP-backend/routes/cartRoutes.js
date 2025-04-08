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

// Helper function to get product details
const getProductById = async (productId) => {
  try {
    // First try casting to integer (most likely case)
    const productResult = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [parseInt(productId, 10)]
    )

    if (productResult.rows.length > 0) {
      return productResult.rows[0]
    }

    // If not found, try as string (fallback)
    const productResultString = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [productId.toString()]
    )

    if (productResultString.rows.length > 0) {
      return productResultString.rows[0]
    }

    console.log(`Product not found for ID: ${productId}`)
    return null
  } catch (error) {
    console.error(`Error fetching product with ID ${productId}:`, error)
    return null
  }
}

// GET /cart - Retrieves cart items with product details
router.get('/cart', auth, async (req, res) => {
  try {
    const userId = req.user.id
    console.log(`Cart GET: userId=${userId}`)

    // Get the cart items
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
    
    if (cartResult.rows.length === 0) {
      return res.json({ success: true, cartItems: [] })
    }

    // Get product details for each cart item
    const cartItems = []
    
    for (const cartItem of cartResult.rows) {
      try {
        const product = await getProductById(cartItem.product_id)
        
        cartItems.push({
          id: cartItem.id,
          product_id: cartItem.product_id,
          quantity: cartItem.quantity,
          created_at: cartItem.created_at,
          updated_at: cartItem.updated_at,
          name: product ? product.name : `Product ${cartItem.product_id}`,
          price: product ? product.price : '0',
          image: product ? product.image_url : null,
          price_unit: product ? product.jednotka : 'ks'
        })
      } catch (error) {
        console.error(`Error processing cart item ${cartItem.id}:`, error)
        // Still add the item to cart, just without product details
        cartItems.push({
          id: cartItem.id,
          product_id: cartItem.product_id,
          quantity: cartItem.quantity,
          created_at: cartItem.created_at,
          updated_at: cartItem.updated_at,
          name: `Product ${cartItem.product_id}`,
          price: '0',
          image: null,
          price_unit: 'ks'
        })
      }
    }

    if (cartItems.length > 0) {
      console.log(`First item with product details: ${JSON.stringify(cartItems[0])}`)
    }

    res.json({ success: true, cartItems })
  } catch (error) {
    console.error('Error fetching cart:', error)
    res.status(500).json({ error: 'Nepodařilo se načíst košík' })
  }
})

// POST /cart - Adds item to cart
router.post('/cart', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body
    const userId = req.user.id

    console.log(`Cart POST: userId=${userId}, productId=${productId}, quantity=${quantity}`)

    // Check if item already exists in cart
    const existingItem = await db.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    )

    console.log(`Existing items found: ${existingItem.rows.length}`)

    let result
    if (existingItem.rows.length > 0) {
      // Update quantity if item exists
      const newQuantity = existingItem.rows[0].quantity + (quantity || 1)
      result = await db.query(
        'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [newQuantity, userId, productId]
      )
      console.log(`Updated cart item: ${JSON.stringify(result.rows[0])}`)
    } else {
      // Insert new item if it doesn't exist
      result = await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
        [userId, productId, quantity || 1]
      )
      console.log(`Inserted new cart item: ${JSON.stringify(result.rows[0])}`)
    }

    // Get product details
    const product = await getProductById(productId)
    
    let cartItem = result.rows[0]
    
    // Add product details to cart item if found
    if (product) {
      cartItem = {
        ...cartItem,
        name: product.name,
        price: product.price,
        image: product.image_url,
        price_unit: product.jednotka || 'ks'
      }
    } else {
      cartItem = {
        ...cartItem,
        name: `Product ${productId}`,
        price: '0',
        image: null,
        price_unit: 'ks'
      }
    }

    res.json({ success: true, cartItem })
  } catch (error) {
    console.error('Error adding to cart:', error)
    res.status(500).json({ error: 'Nepodařilo se přidat položku do košíku' })
  }
})

// PUT /cart/:itemId - Updates cart item quantity
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

    // Get product details for the cart item
    const productId = result.rows[0].product_id
    const product = await getProductById(productId)

    let cartItem = result.rows[0]
    
    // Add product details to cart item if found
    if (product) {
      cartItem = {
        ...cartItem,
        name: product.name,
        price: product.price,
        image: product.image_url,
        price_unit: product.jednotka || 'ks'
      }
    } else {
      cartItem = {
        ...cartItem,
        name: `Product ${productId}`,
        price: '0',
        image: null,
        price_unit: 'ks'
      }
    }

    console.log(`Updated cart item quantity: ${JSON.stringify(cartItem)}`)
    res.json({ success: true, cartItem })
  } catch (error) {
    console.error('Error updating cart item:', error)
    res.status(500).json({ error: 'Nepodařilo se aktualizovat položku košíku' })
  }
})

// DELETE /cart/:itemId - Removes item from cart
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
