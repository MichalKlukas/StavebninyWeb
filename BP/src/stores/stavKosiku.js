// src/stores/stavKosiku.js - FIXED VERSION
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useUserStore } from './useUserStore'
import api from '../config/api'

export const useCart = defineStore('cart', () => {
  const userStore = useUserStore()

  // State
  const items = ref([])
  const shippingMethod = ref('pickup')
  const isLoading = ref(false)
  const error = ref(null)
  const lastSyncTime = ref(null)
  const initialized = ref(false)
  const isInitializing = ref(false) // New flag to prevent duplicate initialization

  // Getters
  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const cartTotal = computed(() => {
    return items.value.reduce((total, item) => {
      const price =
        typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : item.price
      return total + price * item.quantity
    }, 0)
  })

  const shipping = computed(() => {
    if (shippingMethod.value === 'pickup') {
      return 0
    } else if (shippingMethod.value === 'delivery') {
      return cartTotal.value > 2000 ? 0 : 200
    }
    return 0
  })

  const isAuthenticated = computed(() => userStore.isLoggedIn)

  // Watch auth state changes - IMPROVED VERSION without automatic page reload
  watch(
    () => userStore.isLoggedIn,
    async (newValue, oldValue) => {
      console.log(`[Cart] Auth state changed: ${oldValue} → ${newValue}`)

      if (newValue !== oldValue) {
        if (newValue) {
          // User just logged in
          console.log('[Cart] User logged in, handling login')
          await handleLogin()
        } else {
          // User just logged out
          console.log('[Cart] User logged out, handling logout')
          handleLogout()
        }
      }
    }
  )

  // Debug method
  function getStatus() {
    return {
      initialized: initialized.value ? 'Yes' : 'No',
      initializing: isInitializing.value ? 'Yes' : 'No',
      itemCount: items.value.length,
      lastError: error.value,
      isAuthenticated: isAuthenticated.value ? 'Yes' : 'No',
      userId: userStore.user?.id || 'Not logged in',
      lastSync: lastSyncTime.value ? new Date(lastSyncTime.value).toISOString() : 'Never'
    }
  }

  // Initialize cart with improved error handling and atomic operations
  async function initCart() {
    // Prevent duplicate initialization
    if (isInitializing.value) {
      console.log('[Cart] Initialization already in progress, skipping')
      return
    }

    console.log(
      '[Cart] Initializing cart',
      isAuthenticated.value ? `for user ${userStore.user?.id}` : 'for anonymous user'
    )

    isInitializing.value = true
    initialized.value = false
    error.value = null

    try {
      if (isAuthenticated.value) {
        // Load from server for authenticated users
        await loadUserCart()
      } else {
        // Load from localStorage for anonymous users
        loadLocalCart()
      }

      initialized.value = true
      console.log('[Cart] Cart initialized with', items.value.length, 'items')
    } catch (err) {
      console.error('[Cart] Error initializing cart:', err)
      error.value = 'Nepodařilo se načíst košík. Zkuste to prosím znovu.'

      // Fall back to localStorage
      loadLocalCart()
      initialized.value = true
    } finally {
      isInitializing.value = false
    }
  }

  function resetInitialization() {
    console.log('[Cart] Resetting initialization status')
    initialized.value = false
  }

  // Load cart from server with improved error handling
  async function loadUserCart() {
    if (!isAuthenticated.value) {
      console.log('[Cart] Not authenticated, skipping server load')
      return
    }

    try {
      isLoading.value = true
      error.value = null

      console.log('[Cart] Loading user cart from server for user', userStore.user?.id)

      // Add cache-busting parameter to prevent caching
      const timestamp = new Date().getTime()
      const response = await api.get(`/api/user/cart?_nocache=${timestamp}`, {
        headers: {
          Authorization: userStore.token || localStorage.getItem('token')
        }
      })

      if (response.data && Array.isArray(response.data.items)) {
        // Process items
        items.value = response.data.items.map((item) => ({
          ...item,
          price:
            typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : item.price,
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity
        }))

        shippingMethod.value = response.data.shippingMethod || 'pickup'
        console.log(`[Cart] Loaded ${items.value.length} items from server`)
        lastSyncTime.value = new Date()

        // Clear localStorage cart for authenticated users
        localStorage.removeItem('cart')
        localStorage.removeItem('shippingMethod')
      } else {
        console.error('[Cart] Invalid response format from server:', response.data)
        error.value = 'Neplatný formát dat z serveru.'

        // Don't fallback to localStorage for invalid data format
        // This would overwrite the server state with potentially stale local data
      }
    } catch (err) {
      console.error('[Cart] Error loading user cart:', err)
      console.error('[Cart] Error details:', err.response?.data || err.message)
      error.value = 'Nepodařilo se načíst košík. Zkuste to prosím znovu.'

      // Only fallback to localStorage if it's a server error (5xx)
      if (err.response && err.response.status >= 500) {
        console.log('[Cart] Server error, falling back to localStorage')
        loadLocalCart()
      }
    } finally {
      isLoading.value = false
    }
  }

  // Save cart to server with improved error handling
  async function saveUserCart() {
    if (!isAuthenticated.value) {
      console.log('[Cart] Not authenticated, saving to localStorage only')
      saveLocalCart()
      return
    }

    try {
      isLoading.value = true
      error.value = null
      console.log('[Cart] Syncing cart to server for user', userStore.user?.id)

      // Add cache-busting parameter
      const timestamp = new Date().getTime()
      await api.post(
        `/api/user/cart?_nocache=${timestamp}`,
        {
          items: items.value,
          shippingMethod: shippingMethod.value
        },
        {
          headers: {
            Authorization: userStore.token || localStorage.getItem('token')
          }
        }
      )

      console.log(`[Cart] Saved ${items.value.length} items to server`)
      lastSyncTime.value = new Date()
    } catch (err) {
      console.error('[Cart] Error syncing cart to server:', err)
      console.error('[Cart] Error details:', err.response?.data || err.message)
      error.value = 'Nepodařilo se uložit košík. Zkuste to prosím znovu.'

      // Always save to localStorage as backup
      saveLocalCart()
    } finally {
      isLoading.value = false
    }
  }

  // Make sure your loadLocalCart function is working correctly
  function loadLocalCart() {
    try {
      console.log('[Cart] Loading cart from localStorage')

      // Clear current items first
      items.value = []

      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          console.log('[Cart] Found cart in localStorage with', parsedCart.length, 'items')

          if (Array.isArray(parsedCart)) {
            items.value = parsedCart.map((item) => ({
              ...item,
              price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
              quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity
            }))
            console.log('[Cart] Loaded', items.value.length, 'items from localStorage')
          }
        } catch (parseError) {
          console.error('[Cart] Error parsing localStorage cart:', parseError)
        }
      } else {
        console.log('[Cart] No cart found in localStorage')
      }

      const savedShipping = localStorage.getItem('shippingMethod')
      if (savedShipping) {
        shippingMethod.value = savedShipping
      }
    } catch (err) {
      console.error('[Cart] Error loading cart from localStorage:', err)
      items.value = []
    }
  }

  // Save cart to localStorage
  function saveLocalCart() {
    try {
      console.log('[Cart] Saving cart to localStorage')
      localStorage.setItem('cart', JSON.stringify(items.value))
      localStorage.setItem('shippingMethod', shippingMethod.value)
      console.log('[Cart] Cart saved to localStorage, items:', items.value.length)
    } catch (err) {
      console.error('[Cart] Error saving cart to localStorage:', err)
      error.value = 'Nepodařilo se uložit košík do lokálního úložiště.'
    }
  }

  // Add item to cart with improved error handling
  async function addToCart(product, quantity = 1) {
    if (!product || !product.id) {
      console.error('[Cart] Invalid product:', product)
      return
    }

    console.log('[Cart] Adding product to cart:', product)
    console.log('[Cart] User authenticated:', isAuthenticated.value)
    error.value = null

    try {
      // Ensure quantity is a number
      const quantityNum = parseInt(quantity) || 1

      // Find if item already exists in cart
      const existingItemIndex = items.value.findIndex((item) => item.id == product.id)

      console.log('[Cart] Existing item index:', existingItemIndex)

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        console.log('[Cart] Updating existing item quantity')
        items.value[existingItemIndex].quantity += quantityNum
      } else {
        // Add new item if it doesn't exist
        console.log('[Cart] Adding new item to cart')
        items.value.push({
          id: product.id,
          name: product.name,
          price:
            typeof product.price === 'string'
              ? parseFloat(product.price.replace(',', '.'))
              : product.price,
          image: product.image || product.imageUrl || '/placeholder.jpg',
          quantity: quantityNum,
          priceUnit: product.priceUnit || 'ks'
        })
      }

      console.log('[Cart] Updated items:', items.value.length)

      // Always save to localStorage first for quick feedback
      saveLocalCart()

      // If user is logged in, also save to server
      if (isAuthenticated.value) {
        try {
          console.log('[Cart] User is authenticated, saving to server')
          isLoading.value = true

          await api.post(
            '/api/user/cart/add',
            {
              productId: product.id,
              quantity: quantityNum
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: userStore.token || localStorage.getItem('token')
              }
            }
          )

          console.log(`[Cart] Product ${product.id} saved to server`)
        } catch (err) {
          console.error('[Cart] Error saving product to server:', err)
          console.error('[Cart] Error details:', err.response?.data || err.message)
          error.value = 'Nepodařilo se uložit změny v košíku.'

          // Keep local changes anyway - user can try again later
        } finally {
          isLoading.value = false
        }
      }
    } catch (err) {
      console.error('[Cart] Unexpected error in addToCart:', err)
      error.value = 'Nepodařilo se přidat položku do košíku.'
    }
  }

  // Merge local cart with server cart - IMPROVED version
  async function handleLogin() {
    console.log('[Cart] Handling user login for user', userStore.user?.id)

    try {
      isLoading.value = true
      error.value = null
      initialized.value = false

      // Get items from localStorage
      const localCart = localStorage.getItem('cart')
      let localItems = []
      let localShipping = 'pickup'

      if (localCart) {
        try {
          const parsed = JSON.parse(localCart)
          if (Array.isArray(parsed)) {
            localItems = parsed
          }
        } catch (e) {
          console.error('[Cart] Error parsing localStorage cart:', e)
        }
        localShipping = localStorage.getItem('shippingMethod') || 'pickup'
      }

      const hasLocalItems = localItems.length > 0
      console.log(`[Cart] LocalStorage has ${localItems.length} items`)

      if (hasLocalItems) {
        console.log(`[Cart] Merging ${localItems.length} local items with server cart`)

        // Add cache-busting parameter
        const timestamp = new Date().getTime()
        const response = await api.post(
          `/api/user/cart/merge?_nocache=${timestamp}`,
          {
            items: localItems,
            shippingMethod: localShipping
          },
          {
            headers: {
              Authorization: userStore.token || localStorage.getItem('token')
            }
          }
        )

        if (response.data && Array.isArray(response.data.items)) {
          // Clear items first
          items.value = []

          // Set items from response
          items.value = response.data.items.map((item) => ({
            ...item,
            price:
              typeof item.price === 'string'
                ? parseFloat(item.price.replace(',', '.'))
                : item.price,
            quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity
          }))

          shippingMethod.value = response.data.shippingMethod || 'pickup'
          console.log(`[Cart] Merged cart now has ${items.value.length} items`)
        } else {
          console.log('[Cart] No items in merge response, loading from server')
          await loadUserCart()
        }
      } else {
        console.log('[Cart] No local items, loading cart from server')
        await loadUserCart()
      }

      // Clear localStorage after handling login
      localStorage.removeItem('cart')
      localStorage.removeItem('shippingMethod')

      initialized.value = true
      console.log('[Cart] Login cart handling complete')
    } catch (err) {
      console.error('[Cart] Error in handleLogin:', err)
      console.error('[Cart] Error details:', err.response?.data || err.message)

      // Fall back to server cart
      items.value = []
      await loadUserCart()
      initialized.value = true
    } finally {
      isLoading.value = false
    }
  }

  // More robust logout handler
  function handleLogout() {
    console.log('[Cart] Handling user logout')

    try {
      // Copy current cart items
      const cartCopy = JSON.parse(JSON.stringify(items.value))

      // Clear the cart state first
      items.value = []

      // Then save the copy to localStorage
      localStorage.setItem('cart', JSON.stringify(cartCopy))
      localStorage.setItem('shippingMethod', shippingMethod.value)

      // Force a cart reload from localStorage with delay
      setTimeout(() => {
        loadLocalCart()
        console.log('[Cart] Loaded anonymous cart after logout, items:', items.value.length)
      }, 200)
    } catch (err) {
      console.error('[Cart] Error in handleLogout:', err)
      // Fallback
      loadLocalCart()
    }
  }

  // Force a complete refresh with page reload - ONLY use when absolutely necessary
  function forceRefresh() {
    console.log('[Cart] Forcing complete refresh with page reload')

    // Clear everything
    items.value = []
    localStorage.removeItem('cart')
    localStorage.removeItem('shippingMethod')

    // Reload the page
    window.location.reload()
  }

  // Refresh cart from server, with optional forced reload
  async function refreshCart(forceReload = false) {
    console.log('[Cart] Force refreshing cart from server')

    try {
      isLoading.value = true
      error.value = null

      // Clear everything
      items.value = []
      initialized.value = false

      // Force reload from server
      if (isAuthenticated.value) {
        await loadUserCart()
      } else {
        // For anonymous users, clear localStorage and reload
        localStorage.removeItem('cart')
        loadLocalCart()
      }

      initialized.value = true

      if (forceReload) {
        console.log('[Cart] Reloading page as requested')
        window.location.reload()
      }
    } catch (err) {
      console.error('[Cart] Error refreshing cart:', err)
      error.value = 'Nepodařilo se obnovit košík.'
    } finally {
      isLoading.value = false
    }
  }

  // Additional methods for completeness
  async function removeFromCart(index) {
    if (index < 0 || index >= items.value.length) {
      console.error('[Cart] Invalid item index:', index)
      return
    }

    const productId = items.value[index].id
    console.log(`[Cart] Removing product ${productId} from cart`)
    error.value = null

    // Store the removed item in case we need to restore it
    const removedItem = items.value[index]

    // Remove from local state
    items.value.splice(index, 1)

    // Save to localStorage immediately
    saveLocalCart()

    // If user is logged in, also remove from server
    if (isAuthenticated.value) {
      try {
        isLoading.value = true

        await api.post(
          '/api/user/cart/remove',
          {
            productId: removedItem.id
          },
          {
            headers: {
              Authorization: userStore.token || localStorage.getItem('token')
            }
          }
        )

        console.log(`[Cart] Product ${removedItem.id} removed from server`)
      } catch (err) {
        console.error('[Cart] Error removing product from server:', err)
        error.value = 'Nepodařilo se odebrat položku z košíku.'

        // Add the item back if server update fails
        items.value.splice(index, 0, removedItem)
        saveLocalCart()
      } finally {
        isLoading.value = false
      }
    }
  }

  async function updateQuantity(index, quantity) {
    if (index < 0 || index >= items.value.length || quantity <= 0) {
      console.error('[Cart] Invalid update parameters - index:', index, 'quantity:', quantity)
      return
    }

    const item = items.value[index]
    const quantityNum = parseInt(quantity) || 1
    console.log(`[Cart] Updating quantity for product ${item.id} to ${quantityNum}`)
    error.value = null

    const oldQuantity = item.quantity
    item.quantity = quantityNum

    // Save to localStorage
    saveLocalCart()

    // If user is logged in, update on server
    if (isAuthenticated.value) {
      try {
        isLoading.value = true

        await api.post(
          '/api/user/cart/update',
          {
            productId: item.id,
            quantity: quantityNum
          },
          {
            headers: {
              Authorization: userStore.token || localStorage.getItem('token')
            }
          }
        )

        console.log(`[Cart] Product ${item.id} quantity updated on server`)
      } catch (err) {
        console.error('[Cart] Error updating product quantity on server:', err)
        error.value = 'Nepodařilo se aktualizovat množství.'

        // Revert quantity on error
        item.quantity = oldQuantity
        saveLocalCart()
      } finally {
        isLoading.value = false
      }
    }
  }

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

  async function setShippingMethod(method) {
    if (!method || (method !== 'pickup' && method !== 'delivery')) {
      console.error('[Cart] Invalid shipping method:', method)
      return
    }

    console.log(`[Cart] Setting shipping method to: ${method}`)
    error.value = null

    const oldMethod = shippingMethod.value
    shippingMethod.value = method

    // Save to localStorage
    saveLocalCart()

    // If user is logged in, update on server
    if (isAuthenticated.value) {
      try {
        isLoading.value = true

        await api.post(
          '/api/user/cart/shipping',
          {
            shippingMethod: method
          },
          {
            headers: {
              Authorization: userStore.token || localStorage.getItem('token')
            }
          }
        )

        console.log('[Cart] Shipping method updated on server')
      } catch (err) {
        console.error('[Cart] Error updating shipping method on server:', err)
        error.value = 'Nepodařilo se změnit způsob doručení.'

        // Revert on error
        shippingMethod.value = oldMethod
        saveLocalCart()
      } finally {
        isLoading.value = false
      }
    }
  }

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

        await api.post(
          '/api/user/cart/clear',
          {},
          {
            headers: {
              Authorization: userStore.token || localStorage.getItem('token')
            }
          }
        )

        console.log('[Cart] Cart cleared on server')
      } catch (err) {
        console.error('[Cart] Error clearing cart on server:', err)
        error.value = 'Nepodařilo se vyprázdnit košík.'

        // Restore previous state on error
        items.value = oldItems
        shippingMethod.value = oldShippingMethod
        saveLocalCart()
      } finally {
        isLoading.value = false
      }
    }
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
    refreshCart,
    forceRefresh
  }
})
