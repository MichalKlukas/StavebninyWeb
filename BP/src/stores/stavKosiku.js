// src/stores/stavKosiku.js - AGGRESSIVE VERSION with page reload
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

  // Watch auth state changes - AGGRESSIVE VERSION with page reload
  watch(
    () => userStore.isLoggedIn,
    (newValue, oldValue) => {
      console.log(`[Cart] Auth state changed: ${oldValue} → ${newValue}`)

      if (newValue !== oldValue) {
        // Force a complete reset by reloading the page
        console.log('[Cart] Auth state changed, reloading page in 1 second')

        // First clear localStorage cart to prevent it from persisting across logins
        localStorage.removeItem('cart')
        localStorage.removeItem('shippingMethod')

        // Give a delay to let changes take effect
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }
  )

  // Debug method
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

  // Initialize cart
  async function initCart() {
    console.log(
      '[Cart] Initializing cart',
      isAuthenticated.value ? `for user ${userStore.user?.id}` : 'for anonymous user'
    )

    // AGGRESSIVE: Always clear everything first
    items.value = []
    error.value = null
    initialized.value = false

    try {
      // AGGRESSIVE: Add a cache-busting parameter to prevent caching
      if (isAuthenticated.value) {
        await loadUserCart()
      } else {
        loadLocalCart()
      }

      initialized.value = true
      console.log('[Cart] Cart initialized with', items.value.length, 'items')
    } catch (err) {
      console.error('[Cart] Error initializing cart:', err)
      error.value = 'Nepodařilo se načíst košík. Zkuste to prosím znovu.'

      loadLocalCart()
      initialized.value = true
    }
  }

  function resetInitialization() {
    console.log('[Cart] Resetting initialization status')
    initialized.value = false
  }

  // Load cart from server with cache busting
  async function loadUserCart() {
    try {
      isLoading.value = true
      error.value = null

      // AGGRESSIVE: Always clear items before loading
      items.value = []

      console.log('[Cart] Loading user cart from server for user', userStore.user?.id)

      // Add cache-busting parameter to prevent caching
      const timestamp = new Date().getTime()
      const response = await api.get(`/api/user/cart?_nocache=${timestamp}`)

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

        // AGGRESSIVE: Ensure localStorage cart is cleared
        localStorage.removeItem('cart')
        localStorage.removeItem('shippingMethod')
      } else {
        console.error('[Cart] Invalid response format from server')
        error.value = 'Neplatný formát dat z serveru.'
        loadLocalCart()
      }
    } catch (err) {
      console.error('[Cart] Error loading user cart:', err)
      error.value = 'Nepodařilo se načíst košík. Zkuste to prosím znovu.'

      loadLocalCart()
    } finally {
      isLoading.value = false
    }
  }

  // Save cart to server
  async function saveUserCart() {
    if (!isAuthenticated.value) {
      saveLocalCart()
      return
    }

    try {
      isLoading.value = true
      error.value = null
      console.log('[CartStore] Syncing cart to server for user', userStore.user?.id)

      // Add cache-busting parameter
      const timestamp = new Date().getTime()
      await api.post(`/api/user/cart?_nocache=${timestamp}`, {
        items: items.value,
        shippingMethod: shippingMethod.value
      })

      console.log(`[Cart] Saved ${items.value.length} items to server`)
      lastSyncTime.value = new Date()
    } catch (err) {
      console.error('[CartStore] Error syncing cart to server:', err)
      error.value = 'Nepodařilo se uložit košík. Zkuste to prosím znovu.'
      saveLocalCart()
    } finally {
      isLoading.value = false
    }
  }

  // Load cart from localStorage
  function loadLocalCart() {
    try {
      console.log('[Cart] Loading cart from localStorage')

      // AGGRESSIVE: Check if there's a cart in localStorage
      const savedCart = localStorage.getItem('cart')
      const savedShipping = localStorage.getItem('shippingMethod')

      // AGGRESSIVE: Always clear items first
      items.value = []

      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          if (Array.isArray(parsedCart)) {
            items.value = parsedCart.map((item) => ({
              ...item,
              price:
                typeof item.price === 'string'
                  ? parseFloat(item.price.replace(',', '.'))
                  : item.price,
              quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity
            }))
            console.log(`[Cart] Loaded ${items.value.length} items from localStorage`)
          } else {
            console.error('[Cart] Invalid cart format in localStorage')
          }
        } catch (parseError) {
          console.error('[Cart] Error parsing localStorage cart:', parseError)
        }
      } else {
        console.log('[Cart] No cart found in localStorage')
      }

      if (savedShipping) {
        shippingMethod.value = savedShipping
      }
    } catch (err) {
      console.error('[Cart] Error loading cart from localStorage:', err)
      items.value = []
      shippingMethod.value = 'pickup'
      error.value = 'Nepodařilo se načíst košík. Zkuste to prosím znovu.'
    }
  }

  // Save cart to localStorage
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

  // The rest of cart methods remain the same

  // Merge local cart with server cart - AGGRESSIVE version
  async function handleLogin() {
    console.log('[Cart] Handling user login for user', userStore.user?.id)

    try {
      isLoading.value = true
      error.value = null

      // AGGRESSIVE: Always reset state and force a clean start
      items.value = []
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
        const response = await api.post(`/api/user/cart/merge?_nocache=${timestamp}`, {
          items: localItems,
          shippingMethod: localShipping
        })

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

      // AGGRESSIVE: Always clear localStorage after handling login
      localStorage.removeItem('cart')
      localStorage.removeItem('shippingMethod')

      initialized.value = true
      console.log('[Cart] Login cart handling complete')
    } catch (err) {
      console.error('[Cart] Error in handleLogin:', err)

      // Fall back to server cart
      items.value = []
      await loadUserCart()
      initialized.value = true
    } finally {
      isLoading.value = false
    }
  }

  // Handle user logout - AGGRESSIVE version
  function handleLogout() {
    console.log('[Cart] Handling user logout')

    try {
      // AGGRESSIVE: First save cart to localStorage to preserve for anonymous browsing
      localStorage.setItem('cart', JSON.stringify(items.value))
      localStorage.setItem('shippingMethod', shippingMethod.value)

      // Then reset everything
      items.value = []
      error.value = null
      lastSyncTime.value = null
      initialized.value = false

      // Finally load from localStorage for anonymous browsing
      loadLocalCart()
      initialized.value = true

      console.log('[Cart] Logout handling complete')
    } catch (err) {
      console.error('[Cart] Error in handleLogout:', err)

      // Reset everything in case of error
      items.value = []
      initialized.value = false
      loadLocalCart()
      initialized.value = true
    }
  }

  // Force a complete refresh with page reload
  function forceRefresh() {
    console.log('[Cart] Forcing complete refresh with page reload')

    // Clear everything
    items.value = []
    localStorage.removeItem('cart')
    localStorage.removeItem('shippingMethod')

    // Reload the page
    window.location.reload()
  }

  // Add the remaining cart methods from your existing implementation
  // (addToCart, removeFromCart, updateQuantity, etc.)

  // Here's a skeleton implementation for these functions:
  async function addToCart(product, quantity = 1) {
    // Implementation remains the same
  }

  async function removeFromCart(index) {
    // Implementation remains the same
  }

  async function updateQuantity(index, quantity) {
    // Implementation remains the same
  }

  async function increaseQuantity(index) {
    // Implementation remains the same
  }

  async function decreaseQuantity(index) {
    // Implementation remains the same
  }

  async function setShippingMethod(method) {
    // Implementation remains the same
  }

  async function clearCart() {
    // Implementation remains the same
  }

  // New function to immediately refresh cart from server, forcing a reload if needed
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
