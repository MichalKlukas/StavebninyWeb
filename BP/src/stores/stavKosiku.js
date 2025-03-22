// src/stores/stavKosiku.js - Fixed version
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
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
  const initialized = ref(false) // Track initialization status

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

  // Watch for authentication state changes
  watch(
    () => userStore.isLoggedIn,
    (newValue, oldValue) => {
      console.log(`[Cart] Auth state changed: ${oldValue} → ${newValue}`)

      // Only react to actual changes
      if (newValue !== oldValue) {
        if (newValue) {
          // User just logged in
          console.log('[Cart] User logged in, handling login')
          handleLogin()
        } else {
          // User just logged out
          console.log('[Cart] User logged out, handling logout')
          handleLogout()
        }
      }
    }
  )

  // Methods for debugging
  function getStatus() {
    return {
      initialized: initialized.value ? 'Yes' : 'No',
      itemCount: items.value.length,
      lastError: error.value,
      isAuthenticated: isAuthenticated.value ? 'Yes' : 'No',
      userId: userStore.user?.id || 'Not logged in',
      lastSync: lastSyncTime.value ? new Date(lastSyncTime.value).toISOString() : 'Never'
    }
  }

  // Actions

  // Initialize cart
  async function initCart() {
    console.log(
      '[Cart] Initializing cart',
      isAuthenticated.value ? `for user ${userStore.user?.id}` : 'for anonymous user'
    )

    if (initialized.value) {
      console.log('[Cart] Cart already initialized, refreshing data')
    }

    error.value = null

    try {
      // If user is logged in, get cart from server
      if (isAuthenticated.value) {
        await loadUserCart()
      } else {
        // Otherwise load from localStorage
        loadLocalCart()
      }

      initialized.value = true
      console.log('[Cart] Cart initialized with', items.value.length, 'items')
    } catch (err) {
      console.error('[Cart] Error initializing cart:', err)
      error.value = 'Nepodařilo se načíst košík. Zkuste to prosím znovu.'

      // Load from localStorage as fallback even for logged in users
      loadLocalCart()
      initialized.value = true
    }
  }

  // Reset cart initialization status
  function resetInitialization() {
    initialized.value = false
    console.log('[Cart] Cart initialization reset')
  }

  // Load cart for logged-in user from server
  async function loadUserCart() {
    try {
      isLoading.value = true
      error.value = null
      console.log('[Cart] Loading user cart from server for user', userStore.user?.id)

      const response = await api.get('/api/user/cart')

      // Check response format
      console.log('[Cart] Server response received')

      if (response.data && Array.isArray(response.data.items)) {
        // IMPORTANT: Clear items first to prevent duplicate merging
        items.value = []

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

        // IMPORTANT: Remove localStorage cart after successful server load
        localStorage.removeItem('cart')
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
      console.log('[CartStore] Syncing cart to server for user', userStore.user?.id)
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
        try {
          const parsedCart = JSON.parse(savedCart)
          if (Array.isArray(parsedCart)) {
            // IMPORTANT: Clear items first to prevent duplicate merging
            items.value = []

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
        } catch (parseError) {
          console.error('[Cart] Error parsing localStorage cart:', parseError)
          items.value = []
        }
      } else {
        console.log('[Cart] No cart found in localStorage')
        items.value = []
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

    console.log('[CartStore] Adding product to cart:', product.id)
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
    console.log('[Cart] Handling user login for user', userStore.user?.id)

    try {
      isLoading.value = true
      error.value = null

      // Reset initialization
      initialized.value = false

      // Get the current cart from localStorage before any changes
      const localItems = [...items.value]
      const localShipping = shippingMethod.value
      const hasLocalItems = localItems.length > 0

      console.log(`[Cart] Local cart has ${localItems.length} items before login`)

      // IMPORTANT: Clear items to prevent duplicates
      items.value = []

      if (hasLocalItems) {
        console.log(`[Cart] Merging ${localItems.length} local items with server cart`)

        try {
          // Send local cart to server for merging
          const response = await api.post('/api/user/cart/merge', {
            items: localItems,
            shippingMethod: localShipping
          })

          console.log('[Cart] Merge response received')

          // Process response and update cart
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
            console.log(`[Cart] Merged cart now has ${items.value.length} items`)
          } else if (response.data && response.data.success) {
            // Success but no items returned, load from server
            console.log('[Cart] No items in merge response, loading from server')
            await loadUserCart()
          } else {
            console.error('[Cart] Invalid response format from server during merge')
            error.value = 'Neplatný formát dat z serveru.'
            await loadUserCart()
          }
        } catch (mergeErr) {
          console.error('[Cart] Error merging carts:', mergeErr)

          // If merge fails, try loading the server cart
          console.log('[Cart] Merge failed, loading server cart instead')
          await loadUserCart()
        }
      } else {
        // No local items, just load user cart from server
        console.log('[Cart] No local items, loading cart from server')
        await loadUserCart()
      }

      // IMPORTANT: Clear localStorage after successful operation
      localStorage.removeItem('cart')

      // Mark as initialized
      initialized.value = true
      console.log('[Cart] Login cart handling complete')
    } catch (err) {
      console.error('[Cart] Error in handleLogin:', err)
      error.value = 'Chyba při načítání košíku.'

      // Fallback to loading server cart directly
      try {
        await loadUserCart()
      } catch (loadErr) {
        console.error('[Cart] Failed to load cart after error:', loadErr)
      }

      initialized.value = true
    } finally {
      isLoading.value = false
    }
  }

  // Handle user logout
  function handleLogout() {
    console.log('[Cart] Handling user logout')

    try {
      // Save current cart to localStorage before clearing
      saveLocalCart()

      // Store current cart data (for debugging)
      const prevItems = [...items.value]

      // IMPORTANT: Reset cart state
      items.value = []
      error.value = null
      lastSyncTime.value = null
      initialized.value = false

      console.log(`[Cart] Cart state reset, previously had ${prevItems.length} items`)

      // Reload from localStorage for anonymous user
      loadLocalCart()

      // Mark as initialized
      initialized.value = true
      console.log(`[Cart] Reloaded ${items.value.length} items from localStorage after logout`)
    } catch (err) {
      console.error('[Cart] Error in handleLogout:', err)

      // Ensure cart is reset even if there's an error
      items.value = []
      initialized.value = false

      // Try to load from localStorage as fallback
      try {
        loadLocalCart()
        initialized.value = true
      } catch (loadErr) {
        console.error('[Cart] Failed to load local cart after logout error:', loadErr)
      }
    }
  }

  // Force a complete cart refresh
  async function refreshCart() {
    console.log('[Cart] Forcing cart refresh')

    // Reset initialization
    initialized.value = false

    // Clear items
    items.value = []

    // Re-initialize
    await initCart()

    console.log('[Cart] Cart refresh complete')
  }

  return {
    // State
    items,
    shippingMethod,
    isLoading,
    error,
    lastSyncTime,
    initialized,

    // Getters
    itemCount,
    cartTotal,
    shipping,

    // Debug methods
    getStatus,

    // Actions
    initCart,
    resetInitialization,
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
    handleLogout,
    refreshCart
  }
})
