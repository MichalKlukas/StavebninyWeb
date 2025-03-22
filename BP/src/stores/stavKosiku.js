// src/stores/stavKosiku.js - COMPLETE VERSION
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

  // COMPLETE IMPLEMENTATION OF MISSING METHODS

  // Add item to cart
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
          image: product.image || '/placeholder.jpg',
          quantity: quantityNum,
          priceUnit: product.priceUnit || 'ks'
        })
      }

      console.log('[Cart] Updated items:', items.value.length)

      // Save to localStorage first (regardless of auth status)
      saveLocalCart()
      console.log('[Cart] Saved to localStorage')

      // If user is logged in, ALSO save to server
      if (isAuthenticated.value) {
        try {
          console.log('[Cart] User is authenticated, saving to server')
          isLoading.value = true

          // Direct API call with explicit options
          const response = await api.post(
            '/api/user/cart/add',
            {
              productId: product.id,
              quantity: quantityNum
            },
            {
              headers: {
                'Content-Type': 'application/json',
                // Explicitly add auth token as header might be lost
                Authorization: localStorage.getItem('token')
              }
            }
          )

          console.log('[Cart] Server response:', response.data)
          console.log(`[Cart] Product ${product.id} saved to server`)
        } catch (err) {
          console.error('[Cart] Error saving product to server:', err)
          console.error('[Cart] Error details:', err.response?.data || err.message)
          error.value = 'Nepodařilo se uložit změny v košíku.'
        } finally {
          isLoading.value = false
        }
      } else {
        console.log('[Cart] User not authenticated, using only localStorage')
      }
    } catch (err) {
      console.error('[Cart] Unexpected error in addToCart:', err)
      error.value = 'Nepodařilo se přidat položku do košíku.'
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
              Authorization: localStorage.getItem('token')
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

  // Update item quantity
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
              Authorization: localStorage.getItem('token')
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
              Authorization: localStorage.getItem('token')
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

        await api.post(
          '/api/user/cart/clear',
          {},
          {
            headers: {
              Authorization: localStorage.getItem('token')
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
        const response = await api.post(
          `/api/user/cart/merge?_nocache=${timestamp}`,
          {
            items: localItems,
            shippingMethod: localShipping
          },
          {
            headers: {
              Authorization: localStorage.getItem('token')
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
