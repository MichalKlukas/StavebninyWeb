// src/stores/cartStore.js
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './useUserStore'
import api from '../config/api'

export const useCartStore = defineStore('cart', () => {
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
      return total + item.price * item.quantity
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

  const isAuthenticated = computed(() => userStore.isAuthenticated)

  // Actions

  // Initialize cart
  async function initCart() {
    console.log('[Cart] Initializing cart')
    error.value = null

    // If user is logged in, get cart from server
    if (isAuthenticated.value) {
      await loadUserCart()
    } else {
      // Otherwise load from localStorage
      loadLocalCart()
    }
  }

  // Load cart for logged-in user from server
  async function loadUserCart() {
    try {
      isLoading.value = true
      console.log('[Cart] Loading user cart from server')

      const response = await api.get('/api/user/cart')
      items.value = response.data.items || []
      shippingMethod.value = response.data.shippingMethod || 'pickup'

      console.log(`[Cart] Loaded ${items.value.length} items from server`)
      lastSyncTime.value = new Date()
    } catch (err) {
      console.error('[Cart] Error loading user cart:', err)
      error.value = 'Nepodařilo se načíst košík. Zkuste to prosím znovu.'

      // If there's an authentication error, fall back to local cart
      if (err.response && err.response.status === 401) {
        console.log('[Cart] Authentication error, loading local cart instead')
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
      console.log('[Cart] Saving user cart to server')

      await api.post('/api/user/cart', {
        items: items.value,
        shippingMethod: shippingMethod.value
      })

      console.log(`[Cart] Saved ${items.value.length} items to server`)
      lastSyncTime.value = new Date()
    } catch (err) {
      console.error('[Cart] Error saving user cart:', err)
      error.value = 'Nepodařilo se uložit košík. Zkuste to prosím znovu.'
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
        items.value = JSON.parse(savedCart)
        console.log(`[Cart] Loaded ${items.value.length} items from localStorage`)
      }

      if (savedShipping) {
        shippingMethod.value = savedShipping
      }
    } catch (err) {
      console.error('[Cart] Error loading cart from localStorage:', err)
      // Reset to defaults on error
      items.value = []
      shippingMethod.value = 'pickup'
    }
  }

  // Save cart to localStorage for anonymous users
  function saveLocalCart() {
    try {
      console.log('[Cart] Saving cart to localStorage')
      localStorage.setItem('cart', JSON.stringify(items.value))
      localStorage.setItem('shippingMethod', shippingMethod.value)
    } catch (err) {
      console.error('[Cart] Error saving cart to localStorage:', err)
    }
  }

  // Add item to cart
  async function addToCart(product, quantity = 1) {
    if (!product || !product.id) {
      console.error('[Cart] Invalid product:', product)
      return
    }

    console.log(`[Cart] Adding product ${product.id} to cart, quantity: ${quantity}`)
    error.value = null

    // Find if item already exists in cart
    const existingItemIndex = items.value.findIndex((item) => item.id === product.id)

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      items.value[existingItemIndex].quantity += quantity
      console.log(`[Cart] Updated quantity for existing product ${product.id}`)
    } else {
      // Add new item if it doesn't exist
      items.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || '/images/placeholder.jpg',
        quantity: quantity,
        priceUnit: product.priceUnit || 'ks'
      })
      console.log(`[Cart] Added new product ${product.id} to cart`)
    }

    // If user is logged in, save to server
    if (isAuthenticated.value) {
      try {
        isLoading.value = true

        await api.post('/api/user/cart/add', {
          productId: product.id,
          quantity: quantity
        })

        console.log(`[Cart] Product ${product.id} saved to server`)
      } catch (err) {
        console.error('[Cart] Error saving product to server:', err)
        error.value = 'Nepodařilo se uložit změny v košíku. Zkuste to prosím znovu.'
      } finally {
        isLoading.value = false
      }
    } else {
      // Otherwise save to localStorage
      saveLocalCart()
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
      } finally {
        isLoading.value = false
      }
    } else {
      // Otherwise save to localStorage
      saveLocalCart()
    }
  }

  // Update item quantity
  async function updateQuantity(index, quantity) {
    if (index < 0 || index >= items.value.length || quantity <= 0) {
      console.error('[Cart] Invalid update parameters - index:', index, 'quantity:', quantity)
      return
    }

    const item = items.value[index]
    console.log(`[Cart] Updating quantity for product ${item.id} to ${quantity}`)
    error.value = null

    const oldQuantity = item.quantity
    item.quantity = quantity

    // If user is logged in, save to server
    if (isAuthenticated.value) {
      try {
        isLoading.value = true

        await api.post('/api/user/cart/update', {
          productId: item.id,
          quantity: quantity
        })

        console.log(`[Cart] Product ${item.id} quantity updated on server`)
      } catch (err) {
        console.error('[Cart] Error updating product quantity on server:', err)
        error.value = 'Nepodařilo se aktualizovat množství. Zkuste to prosím znovu.'

        // Revert quantity on error
        item.quantity = oldQuantity
      } finally {
        isLoading.value = false
      }
    } else {
      // Otherwise save to localStorage
      saveLocalCart()
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
      } finally {
        isLoading.value = false
      }
    } else {
      // Otherwise save to localStorage
      saveLocalCart()
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
      } finally {
        isLoading.value = false
      }
    } else {
      // Otherwise clear localStorage
      saveLocalCart()
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

        // Send local cart to server for merging
        const response = await api.post('/api/user/cart/merge', {
          items: localItems,
          shippingMethod: localShipping
        })

        // Update local state with merged result
        items.value = response.data.items || []
        shippingMethod.value = response.data.shippingMethod || 'pickup'

        console.log(`[Cart] Merged cart has ${items.value.length} items`)

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
    localStorage.setItem('cart', JSON.stringify(items.value))
    localStorage.setItem('shippingMethod', shippingMethod.value)
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
