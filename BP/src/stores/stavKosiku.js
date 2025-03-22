// src/stores/stavKosiku.js
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './useUserStore'
import api from '../config/api'

export const useCart = defineStore('cart', () => {
  const userStore = useUserStore()

  // State
  const items = ref([])
  const shippingMethod = ref('pickup') // Default shipping method
  const isLoading = ref(false)
  const error = ref(null)
  const lastSyncTime = ref(null)

  // Getters
  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const cartTotal = computed(() => {
    return items.value.reduce((total, item) => {
      // Ensure price is treated as a number
      const price =
        typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : item.price
      return total + price * item.quantity
    }, 0)
  })

  const shipping = computed(() => {
    // Calculate shipping based on selected method and cart total
    if (shippingMethod.value === 'pickup') {
      return 0
    } else if (shippingMethod.value === 'delivery') {
      // Free shipping for orders over 2000 CZK
      return cartTotal.value > 2000 ? 0 : 200
    }
    return 0
  })

  const isAuthenticated = computed(() => userStore.isLoggedIn)

  // Methods for debugging
  function getStatus() {
    return {
      initialized: lastSyncTime.value ? 'Yes' : 'No',
      itemCount: items.value.length,
      lastError: error.value
    }
  }

  // Actions

  // Initialize cart
  async function initCart() {
    console.log('[Cart] Initializing cart')
    error.value = null

    try {
      // If user is logged in, get cart from server
      if (isAuthenticated.value) {
        await loadUserCart()
      } else {
        // Otherwise load from localStorage
        loadLocalCart()
      }
      console.log('[Cart] Cart initialized with', items.value.length, 'items')
    } catch (err) {
      console.error('[Cart] Error initializing cart:', err)
      error.value = 'Nepodařilo se načíst košík. Zkuste to prosím znovu.'
      // Load from localStorage as fallback even for logged in users
      loadLocalCart()
    }
  }

  // Load cart for logged-in user from server
  async function loadUserCart() {
    try {
      isLoading.value = true
      error.value = null
      console.log('[Cart] Loading user cart from server')

      const response = await api.get('/api/user/cart')

      // Check response format
      console.log('[Cart] Server response:', response.data)

      if (response.data && Array.isArray(response.data.items)) {
        items.value = response.data.items.map((item) => ({
          ...item,
          // Ensure price is a number
          price:
            typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : item.price,
          // Ensure quantity is a number
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity
        }))

        shippingMethod.value = response.data.shippingMethod || 'pickup'
        console.log(`[Cart] Loaded ${items.value.length} items from server`)
        lastSyncTime.value = new Date()
      } else {
        console.error('[Cart] Invalid response format from server')
        error.value = 'Neplatný formát dat z serveru.'
        loadLocalCart() // Fallback to localStorage
      }
    } catch (err) {
      console.error('[Cart] Error loading user cart:', err)
      console.error('[Cart] Error details:', err.message)

      error.value = 'Nepodařilo se načíst košík. Zkuste to prosím znovu.'

      // If there's an authentication error, fall back to local cart
      if (err.response && err.response.status === 401) {
        console.log('[Cart] Authentication error, loading local cart instead')
        loadLocalCart()
      } else {
        // Otherwise also fall back to local cart
        loadLocalCart()
      }
    } finally {
      isLoading.value = false
    }
  }

  // Save cart for logged-in user to server
  async function saveUserCart() {
    if (!isAuthenticated.value) {
      saveLocalCart()
      return
    }

    try {
      isLoading.value = true
      error.value = null
      console.log('[CartStore] Syncing cart to server: /api/user/cart')
      console.log('[CartStore] Items being sent:', items.value.length)

      await api.post('/api/user/cart', {
        items: items.value,
        shippingMethod: shippingMethod.value
      })

      console.log(`[Cart] Saved ${items.value.length} items to server`)
      lastSyncTime.value = new Date()
    } catch (err) {
      console.error('[CartStore] Error syncing cart to server:', err)
      console.error('[CartStore] Error details:', err.message)
      error.value = 'Nepodařilo se uložit košík. Zkuste to prosím znovu.'

      // Always save to localStorage as a backup
      saveLocalCart()
    } finally {
      isLoading.value = false
    }
  }

  // Load cart from localStorage for anonymous users
  function loadLocalCart() {
    try {
      console.log('[Cart] Loading cart from localStorage')
      const savedCart = localStorage.getItem('cart')
      const savedShipping = localStorage.getItem('shippingMethod')

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        if (Array.isArray(parsedCart)) {
          items.value = parsedCart.map((item) => ({
            ...item,
            // Ensure price is a number
            price:
              typeof item.price === 'string'
                ? parseFloat(item.price.replace(',', '.'))
                : item.price,
            // Ensure quantity is a number
            quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity
          }))
          console.log(`[Cart] Loaded ${items.value.length} items from localStorage`)
        } else {
          console.error('[Cart] Invalid cart format in localStorage')
          items.value = []
        }
      }

      if (savedShipping) {
        shippingMethod.value = savedShipping
      }
    } catch (err) {
      console.error('[Cart] Error loading cart from localStorage:', err)
      // Reset to defaults on error
      items.value = []
      shippingMethod.value = 'pickup'
      error.value = 'Nepodařilo se načíst košík. Zkuste to prosím znovu.'
    }
  }

  // Save cart to localStorage for anonymous users
  function saveLocalCart() {
    try {
      console.log('[CartStore] Saving cart to localStorage')
      localStorage.setItem('cart', JSON.stringify(items.value))
      localStorage.setItem('shippingMethod', shippingMethod.value)
      console.log('[CartStore] Cart saved to localStorage, items:', items.value.length)
    } catch (err) {
      console.error('[Cart] Error saving cart to localStorage:', err)
      error.value = 'Nepodařilo se uložit košík do lokálního úložiště.'
    }
  }

  // Add item to cart
  async function addToCart(product, quantity = 1) {
    if (!product || !product.id) {
      console.error('[Cart] Invalid product:', product)
      return
    }

    console.log('[CartStore] Adding product to cart:', product)
    error.value = null

    // Ensure quantity is a number
    const quantityNum = parseInt(quantity) || 1

    // Ensure price is a number
    const price =
      typeof product.price === 'string'
        ? parseFloat(product.price.replace(',', '.'))
        : product.price

    // Find if item already exists in cart
    const existingItemIndex = items.value.findIndex((item) => item.id === product.id)

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      items.value[existingItemIndex].quantity += quantityNum
    } else {
      // Add new item if it doesn't exist
      items.value.push({
        id: product.id,
        name: product.name,
        price: price,
        image: product.image || '/placeholder.jpg',
        quantity: quantityNum,
        priceUnit: product.priceUnit || 'ks'
      })
    }

    // Save to localStorage for both logged-in and anonymous users (backup)
    saveLocalCart()

    // If user is logged in, also save to server
    if (isAuthenticated.value) {
      try {
        await saveUserCart()
      } catch (err) {
        console.error('[Cart] Error after adding product:', err)
        // Cart is already saved to localStorage, no need to handle error further
      }
    }
  }

  // Remove item from cart
  async function removeFromCart(index) {
    if (index < 0 || index >= items.value.length) {
      console.error('[Cart] Invalid item index:', index)
      return
    }

    const productId = items.value[index].id
    console.log(`[Cart] Removing product ${productId} from cart`)
    error.value = null

    // Remove item from local state
    const removedItem = items.value.splice(index, 1)[0]

    // Save to localStorage for both logged-in and anonymous users (backup)
    saveLocalCart()

    // If user is logged in, save to server
    if (isAuthenticated.value) {
      try {
        isLoading.value = true

        await api.post('/api/user/cart/remove', {
          productId: removedItem.id
        })

        console.log(`[Cart] Product ${removedItem.id} removed from server`)
      } catch (err) {
        console.error('[Cart] Error removing product from server:', err)
        error.value = 'Nepodařilo se odebrat položku z košíku. Zkuste to prosím znovu.'

        // Add item back on error
        items.value.splice(index, 0, removedItem)
        // Update localStorage with the restored item
        saveLocalCart()
      } finally {
        isLoading.value = false
      }
    }
  }

  // Update item quantity
  async function updateQuantity(index, quantity) {
    if (index < 0 || index >= items.value.length || quantity <= 0) {
      console.error('[Cart] Invalid update parameters - index:', index, 'quantity:', quantity)
      return
    }

    const quantityNum = parseInt(quantity) || 1
    const item = items.value[index]
    console.log(`[Cart] Updating quantity for product ${item.id} to ${quantityNum}`)
    error.value = null

    const oldQuantity = item.quantity
    item.quantity = quantityNum

    // Save to localStorage for both logged-in and anonymous users (backup)
    saveLocalCart()

    // If user is logged in, save to server
    if (isAuthenticated.value) {
      try {
        isLoading.value = true

        await api.post('/api/user/cart/update', {
          productId: item.id,
          quantity: quantityNum
        })

        console.log(`[Cart] Product ${item.id} quantity updated on server`)
      } catch (err) {
        console.error('[Cart] Error updating product quantity on server:', err)
        error.value = 'Nepodařilo se aktualizovat množství. Zkuste to prosím znovu.'

        // Revert quantity on error
        item.quantity = oldQuantity
        // Update localStorage with the restored quantity
        saveLocalCart()
      } finally {
        isLoading.value = false
      }
    }
  }

  // Convenience methods for increasing/decreasing quantity
  async function increaseQuantity(index) {
    if (index >= 0 && index < items.value.length) {
      await updateQuantity(index, items.value[index].quantity + 1)
    }
  }

  async function decreaseQuantity(index) {
    if (index >= 0 && index < items.value.length && items.value[index].quantity > 1) {
      await updateQuantity(index, items.value[index].quantity - 1)
    } else if (index >= 0 && index < items.value.length && items.value[index].quantity === 1) {
      await removeFromCart(index)
    }
  }

  // Set shipping method
  async function setShippingMethod(method) {
    if (!method || (method !== 'pickup' && method !== 'delivery')) {
      console.error('[Cart] Invalid shipping method:', method)
      return
    }

    console.log(`[Cart] Setting shipping method to: ${method}`)
    error.value = null

    const oldMethod = shippingMethod.value
    shippingMethod.value = method

    // Save to localStorage for both logged-in and anonymous users (backup)
    saveLocalCart()

    // If user is logged in, save to server
    if (isAuthenticated.value) {
      try {
        isLoading.value = true

        await api.post('/api/user/cart/shipping', {
          shippingMethod: method
        })

        console.log('[Cart] Shipping method updated on server')
      } catch (err) {
        console.error('[Cart] Error updating shipping method on server:', err)
        error.value = 'Nepodařilo se změnit způsob doručení. Zkuste to prosím znovu.'

        // Revert on error
        shippingMethod.value = oldMethod
        saveLocalCart()
      } finally {
        isLoading.value = false
      }
    }
  }

  // Clear cart
  async function clearCart() {
    console.log('[Cart] Clearing cart')
    error.value = null

    const oldItems = [...items.value]
    const oldShippingMethod = shippingMethod.value

    // Clear local state
    items.value = []

    // Update localStorage
    saveLocalCart()

    // If user is logged in, clear on server
    if (isAuthenticated.value) {
      try {
        isLoading.value = true

        await api.post('/api/user/cart/clear')

        console.log('[Cart] Cart cleared on server')
      } catch (err) {
        console.error('[Cart] Error clearing cart on server:', err)
        error.value = 'Nepodařilo se vyprázdnit košík. Zkuste to prosím znovu.'

        // Restore previous state on error
        items.value = oldItems
        shippingMethod.value = oldShippingMethod
        saveLocalCart()
      } finally {
        isLoading.value = false
      }
    }
  }

  // Merge local cart with server cart when user logs in
  async function handleLogin() {
    console.log('[Cart] Handling user login')
    const localItems = [...items.value]
    const localShipping = shippingMethod.value

    if (localItems.length > 0) {
      console.log(`[Cart] Merging ${localItems.length} local items with server cart`)
      try {
        isLoading.value = true
        error.value = null

        // Send local cart to server for merging
        const response = await api.post('/api/user/cart/merge', {
          items: localItems,
          shippingMethod: localShipping
        })

        // Update local state with merged result
        if (response.data && Array.isArray(response.data.items)) {
          items.value = response.data.items.map((item) => ({
            ...item,
            // Ensure price is a number
            price:
              typeof item.price === 'string'
                ? parseFloat(item.price.replace(',', '.'))
                : item.price,
            // Ensure quantity is a number
            quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity
          }))

          shippingMethod.value = response.data.shippingMethod || 'pickup'
          console.log(`[Cart] Merged cart has ${items.value.length} items`)
        } else if (response.data && response.data.success) {
          // Success but no items returned, load from server
          await loadUserCart()
        } else {
          console.error('[Cart] Invalid response format from server during merge')
          error.value = 'Neplatný formát dat z serveru.'
          await loadUserCart()
        }

        // Clear localStorage cart after successful merge
        localStorage.removeItem('cart')
        localStorage.removeItem('shippingMethod')
      } catch (err) {
        console.error('[Cart] Error merging carts:', err)
        error.value = 'Nepodařilo se sloučit košíky. Zkuste to prosím znovu.'

        // If merge fails, try loading the server cart
        await loadUserCart()
      } finally {
        isLoading.value = false
      }
    } else {
      // No local items, just load user cart from server
      await loadUserCart()
    }
  }

  // Handle user logout
  function handleLogout() {
    console.log('[Cart] Handling user logout')

    // Save current cart to localStorage before clearing
    saveLocalCart()

    // IMPORTANT: Reset cart state to defaults
    items.value = []
    error.value = null
    lastSyncTime.value = null

    // Then reload from localStorage (for anonymous user)
    setTimeout(() => {
      loadLocalCart()
      console.log('[Cart] Cart reset to anonymous state after logout')
    }, 100)
  }

  return {
    // State
    items,
    shippingMethod,
    isLoading,
    error,
    lastSyncTime,

    // Getters
    itemCount,
    cartTotal,
    shipping,

    // Debug methods
    getStatus,

    // Actions
    initCart,
    loadUserCart,
    saveUserCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    setShippingMethod,
    clearCart,
    handleLogin,
    handleLogout
  }
})
