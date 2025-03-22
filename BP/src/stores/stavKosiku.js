import { reactive, computed, watch } from 'vue'
import axios from 'axios'
import { useUserStore } from './index'

// API baseURL – make sure to add /api to all endpoints
const BASE_URL = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'
const API_URL = `${BASE_URL}/api`

// Helper function to parse price strings correctly
const parsePrice = (priceString) => {
  if (typeof priceString === 'number') return priceString
  if (typeof priceString === 'string') {
    let cleanPrice = priceString.replace(/[^\d,\.]/g, '')
    cleanPrice = cleanPrice.replace(',', '.')
    return parseFloat(cleanPrice) || 0
  }
  return 0
}

// Helper: Get dynamic localStorage key based on authentication status
const getLocalCartKey = () => {
  const userStore = useUserStore()
  return userStore.isAuthenticated && userStore.user?.id
    ? `kosik_${userStore.user.id}`
    : 'kosik_guest'
}

// Reactive state for the cart
const state = reactive({
  items: [],
  shippingMethod: 'pickup', // default shipping method is pickup (free)
  loading: false,
  error: null,
  initialized: false
})

// Initialize the cart (load local cart then, if authenticated, load from server)
const initializeCart = async () => {
  if (state.initialized) return
  state.initialized = true

  const userStore = useUserStore()

  try {
    state.loading = true

    // Always load from localStorage first using the dynamic key
    loadLocalCart()
    console.log('Local cart loaded')

    // If the user is authenticated, try to load the cart from the server
    if (userStore.isAuthenticated) {
      console.log('User is authenticated, checking cart API status...')
      try {
        await axios
          .get(`${API_URL}/cart/status`)
          .then((response) => {
            console.log('Cart API status check successful:', response.data)
            if (response.data.success) {
              return loadServerCart()
            }
          })
          .catch((error) => {
            console.error('Cart API status check failed:', error)
          })
      } catch (error) {
        console.error('Error checking cart API status:', error)
      }
    } else {
      console.log('User not authenticated, using local cart only')
    }

    state.loading = false
  } catch (error) {
    console.error('Error initializing cart:', error)
    state.error = 'Nepodařilo se načíst košík'
    state.loading = false
  }
}

// Load the cart from localStorage using the dynamic key
const loadLocalCart = () => {
  try {
    const savedCart = localStorage.getItem(getLocalCartKey())
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      state.items = parsedCart.items || []
      state.shippingMethod = parsedCart.shippingMethod || 'pickup'
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error)
    state.error = 'Nepodařilo se načíst košík z lokálního úložiště'
    state.items = []
    state.shippingMethod = 'pickup'
  }
}

// Load the cart from the server
const loadServerCart = async () => {
  const userStore = useUserStore()
  if (!userStore.isAuthenticated || !userStore.token) {
    console.log('User not authenticated, skipping server cart load')
    return
  }
  try {
    const response = await axios.get(`${API_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    })

    if (response.data.success) {
      state.items = response.data.cartItems.map((item) => ({
        id: item.product_id,
        quantity: item.quantity,
        dbId: item.id, // Database record ID for later use
        name: item.product_name || 'Produktové ID: ' + item.product_id,
        price: item.product_price || '0',
        image: item.product_image || '/placeholder.jpg',
        priceUnit: item.product_unit || 'kus'
      }))

      // Also load the user’s shipping preferences
      try {
        const prefsResponse = await axios.get(`${API_URL}/user/preferences/shipping`, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        })
        if (prefsResponse.data.success) {
          state.shippingMethod = prefsResponse.data.shippingMethod
        }
      } catch (prefsError) {
        console.error('Error loading shipping preferences:', prefsError)
      }
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('Authentication token invalid or expired')
      userStore.logout()
    }
    console.error('Error loading cart from server:', error)
    throw error
  }
}

// Save the cart to localStorage using the dynamic key (for guests)
const saveCart = async () => {
  const userStore = useUserStore()
  try {
    if (userStore.isAuthenticated) {
      // For authenticated users, the cart is synchronized via API calls
    } else {
      localStorage.setItem(
        getLocalCartKey(),
        JSON.stringify({
          items: state.items,
          shippingMethod: state.shippingMethod
        })
      )
    }
  } catch (error) {
    console.error('Error saving cart:', error)
    state.error = 'Nepodařilo se uložit košík'
  }
}

// Sync local cart with the server when a guest logs in
const syncCartWithServer = async () => {
  const userStore = useUserStore()
  if (!userStore.isAuthenticated) return

  try {
    state.loading = true

    // Get the local items from the guest cart
    const localItems = state.items

    // Send local items to the server (the backend will merge them)
    await axios.post(
      `${API_URL}/cart/sync`,
      { items: localItems },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      }
    )

    // Reload the updated server cart and remove the guest cart from localStorage
    await loadServerCart()
    localStorage.removeItem(getLocalCartKey())
    state.loading = false
  } catch (error) {
    console.error('Error syncing cart with server:', error)
    state.error = 'Nepodařilo se synchronizovat košík se serverem'
    state.loading = false
  }
}

// Add a product to the cart
const addToCart = async (product) => {
  const userStore = useUserStore()
  try {
    state.loading = true

    // Process the product to ensure correct price format
    const processedProduct = {
      ...product,
      price: parsePrice(product.price)
    }

    // Check if the product is already in the cart
    const existingIndex = state.items.findIndex((item) => item.id === processedProduct.id)

    if (userStore.isAuthenticated) {
      const response = await axios.post(
        `${API_URL}/cart`,
        {
          productId: processedProduct.id,
          quantity: 1,
          price: processedProduct.price,
          name: processedProduct.name,
          image: processedProduct.image || '/placeholder.jpg',
          priceUnit: processedProduct.priceUnit || 'kus'
        },
        {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        }
      )

      if (response.data.success) {
        if (existingIndex !== -1) {
          state.items[existingIndex].quantity++
          state.items[existingIndex].dbId = response.data.cartItem.id
        } else {
          state.items.push({
            id: processedProduct.id,
            name: processedProduct.name,
            price: processedProduct.price,
            image: processedProduct.image || '/placeholder.jpg',
            priceUnit: processedProduct.priceUnit || 'kus',
            quantity: 1,
            dbId: response.data.cartItem.id
          })
        }
      }
    } else {
      // For guest users, update the local cart
      if (existingIndex !== -1) {
        state.items[existingIndex].quantity++
      } else {
        state.items.push({
          ...processedProduct,
          quantity: 1,
          image: processedProduct.image || '/placeholder.jpg',
          priceUnit: processedProduct.priceUnit || 'kus'
        })
      }
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error adding to cart:', error)
    state.error = 'Nepodařilo se přidat položku do košíku'
    state.loading = false
  }
}

// Remove an item from the cart
const removeFromCart = async (index) => {
  const userStore = useUserStore()
  try {
    state.loading = true

    if (userStore.isAuthenticated) {
      const item = state.items[index]
      if (item && item.dbId) {
        await axios.delete(`${API_URL}/cart/${item.dbId}`, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        })
      }
    }

    state.items.splice(index, 1)

    if (!userStore.isAuthenticated) {
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error removing from cart:', error)
    state.error = 'Nepodařilo se odstranit položku z košíku'
    state.loading = false
  }
}

// Update the quantity of an item
const updateQuantity = async (index, quantity) => {
  const userStore = useUserStore()
  try {
    state.loading = true
    if (quantity < 1) quantity = 1

    if (userStore.isAuthenticated) {
      const item = state.items[index]
      if (item && item.dbId) {
        await axios.put(
          `${API_URL}/cart/${item.dbId}`,
          { quantity },
          {
            headers: {
              Authorization: `Bearer ${userStore.token}`
            }
          }
        )
      }
    }
    state.items[index].quantity = quantity
    if (!userStore.isAuthenticated) {
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error updating quantity:', error)
    state.error = 'Nepodařilo se aktualizovat množství položky'
    state.loading = false
  }
}

const increaseQuantity = (index) => {
  updateQuantity(index, state.items[index].quantity + 1)
}

const decreaseQuantity = (index) => {
  if (state.items[index].quantity > 1) {
    updateQuantity(index, state.items[index].quantity - 1)
  }
}

// Set the shipping method
const setShippingMethod = async (method) => {
  const userStore = useUserStore()
  try {
    state.loading = true
    state.shippingMethod = method

    if (userStore.isAuthenticated) {
      await axios.put(
        `${API_URL}/user/preferences/shipping`,
        { shippingMethod: method },
        {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        }
      )
    }
    if (!userStore.isAuthenticated) {
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error setting shipping method:', error)
    state.error = 'Nepodařilo se nastavit způsob dopravy'
    state.loading = false
  }
}

// Clear the cart
const clearCart = async () => {
  const userStore = useUserStore()
  try {
    state.loading = true
    if (userStore.isAuthenticated) {
      for (const item of state.items) {
        if (item.dbId) {
          await axios.delete(`${API_URL}/cart/${item.dbId}`, {
            headers: {
              Authorization: `Bearer ${userStore.token}`
            }
          })
        }
      }
    }
    state.items = []
    if (!userStore.isAuthenticated) {
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error clearing cart:', error)
    state.error = 'Nepodařilo se vyčistit košík'
    state.loading = false
  }
}

// Computed properties for totals and counts
const cartTotal = computed(() => {
  return state.items.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0)
})

const shipping = computed(() => {
  return state.shippingMethod === 'delivery' ? 150 : 0
})

const itemCount = computed(() => {
  return state.items.reduce((count, item) => count + item.quantity, 0)
})

// Main export for the cart store
export const useCart = () => {
  const userStore = useUserStore()
  if (!state.initialized) {
    initializeCart()
  }

  // Watch for changes in authentication to sync/restore the appropriate cart
  watch(
    () => userStore.isAuthenticated,
    async (isAuthenticated, wasAuthenticated) => {
      if (isAuthenticated && !wasAuthenticated) {
        await syncCartWithServer()
      } else if (!isAuthenticated && wasAuthenticated) {
        loadLocalCart()
      }
    }
  )

  return {
    items: computed(() => state.items),
    itemCount,
    cartTotal,
    shipping,
    shippingMethod: computed(() => state.shippingMethod),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    setShippingMethod,
    clearCart,
    syncCartWithServer
  }
}
