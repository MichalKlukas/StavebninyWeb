// src/stores/stavKosiku.ts
import { reactive, computed } from 'vue'
import axios from 'axios'
import { useUserStore } from './index'

// ========== TYPES ==========

interface CartItem {
  id: number
  quantity: number
  dbId?: number
  name: string
  price: number | string
  image: string
  priceUnit: string
}

interface CartState {
  items: CartItem[]
  shippingMethod: string
  loading: boolean
  error: string | null
  initialized: boolean
  debugInfo: string[]
}

type Product = any

// ========== CONSTANTS ==========

const BASE_URL = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'
const API_URL = `${BASE_URL}/api`

// ========== HELPERS ==========

function parsePrice(priceString: number | string): number {
  if (typeof priceString === 'number') return priceString
  if (typeof priceString === 'string') {
    let cleanPrice = priceString.replace(/[^\d,\.]/g, '')
    cleanPrice = cleanPrice.replace(',', '.')
    return parseFloat(cleanPrice) || 0
  }
  return 0
}

function getLocalCartKey(): string {
  const userStore = useUserStore()
  const key =
    userStore.isAuthenticated && userStore.user?.id ? `kosik_${userStore.user.id}` : 'kosik_guest'

  // Add debug info
  addDebugInfo(`Using localStorage key: ${key}`)
  return key
}

// ========== REACTIVE STATE ==========

const state = reactive<CartState>({
  items: [],
  shippingMethod: 'pickup',
  loading: false,
  error: null,
  initialized: false,
  debugInfo: []
})

// Debug helper function
function addDebugInfo(info: string): void {
  const timestamp = new Date().toISOString()
  state.debugInfo.push(`[${timestamp}] ${info}`)
  console.log(`[CART] ${info}`)

  // Keep only the last 50 messages
  if (state.debugInfo.length > 50) {
    state.debugInfo.shift()
  }
}

// Clean up old localStorage entries
function cleanupLocalStorage(): void {
  addDebugInfo('Cleaning up localStorage entries')
  // Remove the old keys that shouldn't be used anymore
  try {
    localStorage.removeItem('cart')
    localStorage.removeItem('cart_2')
    localStorage.removeItem('shippingMethod')
    localStorage.removeItem('shipping_2')
    localStorage.removeItem('anonymous_shipping')
  } catch (error) {
    console.error('Error cleaning up localStorage:', error)
  }
}

// ========== MAIN FUNCTIONS ==========

async function initializeCart(): Promise<void> {
  if (state.initialized) return
  state.initialized = true

  addDebugInfo('Initializing cart')
  cleanupLocalStorage()

  const userStore = useUserStore()
  try {
    state.loading = true

    // Always load local cart first to ensure we have something to display
    loadLocalCart()

    if (userStore.isAuthenticated) {
      addDebugInfo('User is authenticated, checking cart API status')
      try {
        const resp = await axios.get(`${API_URL}/cart/status`)
        if (resp.data.success) {
          addDebugInfo('Cart API is available, loading server cart')
          // If API is available, load server cart (which will override local cart for logged-in users)
          await loadServerCart()
        } else {
          addDebugInfo('Cart API status check failed')
        }
      } catch (err) {
        addDebugInfo(`Cart API status check error: ${err}`)
        console.error('Cart API status check failed:', err)
      }
    } else {
      addDebugInfo('User is not authenticated, using local cart only')
    }
    state.loading = false
  } catch (error) {
    console.error('Error initializing cart:', error)
    addDebugInfo(`Error initializing cart: ${error}`)
    state.error = 'Nepodařilo se načíst košík'
    state.loading = false
  }
}

function loadLocalCart(): void {
  try {
    const localCartKey = getLocalCartKey()
    addDebugInfo(`Loading local cart from key: ${localCartKey}`)

    const savedCart = localStorage.getItem(localCartKey)
    if (savedCart) {
      addDebugInfo('Found saved cart in localStorage')
      const parsed = JSON.parse(savedCart)
      state.items = parsed.items || []
      state.shippingMethod = parsed.shippingMethod || 'pickup'
      addDebugInfo(`Loaded ${state.items.length} items from localStorage`)
    } else {
      addDebugInfo('No saved cart found in localStorage')
      state.items = []
      state.shippingMethod = 'pickup'
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error)
    addDebugInfo(`Error loading cart from localStorage: ${error}`)
    state.error = 'Nepodařilo se načíst košík z lokálního úložiště'
    state.items = []
    state.shippingMethod = 'pickup'
  }
}

async function loadServerCart(): Promise<void> {
  const userStore = useUserStore()
  if (!userStore.isAuthenticated || !userStore.token) {
    addDebugInfo('Cannot load server cart - user not authenticated')
    return
  }

  addDebugInfo('Loading cart from server')
  try {
    const response = await axios.get(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })

    if (response.data.success) {
      addDebugInfo(`Server cart loaded, items: ${response.data.cartItems.length}`)
      state.items = response.data.cartItems.map((item: any) => ({
        id: item.product_id,
        quantity: item.quantity,
        dbId: item.id,
        name: item.product_name || 'Produktové ID: ' + item.product_id,
        price: item.product_price || '0',
        image: item.product_image || '/placeholder.jpg',
        priceUnit: item.product_unit || 'kus'
      }))

      // Try to load shipping preferences - but don't fail if this errors
      try {
        addDebugInfo('Loading shipping preferences')
        const prefs = await axios.get(`${API_URL}/user/preferences/shipping`, {
          headers: { Authorization: `Bearer ${userStore.token}` }
        })

        if (prefs.data.success) {
          addDebugInfo(`Shipping preferences loaded: ${prefs.data.shippingMethod}`)
          state.shippingMethod = prefs.data.shippingMethod
        } else {
          addDebugInfo('Failed to load shipping preferences, using default')
        }
      } catch (err) {
        addDebugInfo(`Error loading shipping preferences: ${err}`)
        console.error('Error loading shipping preferences:', err)
      }
    } else {
      addDebugInfo('Server returned error when loading cart')
    }
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      addDebugInfo('Unauthorized when loading server cart, logging out')
      const userStore = useUserStore()
      userStore.logout()
    }
    addDebugInfo(`Error loading cart from server: ${error}`)
    console.error('Error loading cart from server:', error)
    throw error
  }
}

async function saveCart(): Promise<void> {
  try {
    const localCartKey = getLocalCartKey()
    addDebugInfo(`Saving cart to localStorage with key: ${localCartKey}`)

    localStorage.setItem(
      localCartKey,
      JSON.stringify({
        items: state.items,
        shippingMethod: state.shippingMethod
      })
    )
    addDebugInfo(`Cart saved with ${state.items.length} items`)
  } catch (error) {
    console.error('Error saving cart:', error)
    addDebugInfo(`Error saving cart: ${error}`)
    state.error = 'Nepodařilo se uložit košík'
  }
}

async function syncCartWithServer(): Promise<void> {
  const userStore = useUserStore()
  if (!userStore.isAuthenticated) {
    addDebugInfo('Cannot sync cart - user not authenticated')
    return
  }

  addDebugInfo('Syncing cart with server')
  try {
    state.loading = true
    const localItems = [...state.items] // Make a copy to preserve the local items

    addDebugInfo(`Sending ${localItems.length} items to server for sync`)
    // Send local items to be merged with server cart
    const syncResponse = await axios.post(
      `${API_URL}/cart/sync`,
      { items: localItems },
      { headers: { Authorization: `Bearer ${userStore.token}` } }
    )

    if (syncResponse.data.success) {
      addDebugInfo('Cart sync successful')

      // Reload the updated cart from server
      await loadServerCart()

      // User is now logged in, so we don't need the guest cart anymore
      if (userStore.user?.id) {
        addDebugInfo('Removing guest cart after successful sync')
        localStorage.removeItem('kosik_guest')
      }
    } else {
      addDebugInfo('Cart sync returned error from server')
    }

    state.loading = false
  } catch (error) {
    console.error('Error syncing cart with server:', error)
    addDebugInfo(`Error syncing cart with server: ${error}`)
    state.error = 'Nepodařilo se synchronizovat košík se serverem'
    state.loading = false
  }
}

async function addToCart(product: Product): Promise<void> {
  const userStore = useUserStore()
  addDebugInfo(`Adding to cart: ${product.id} - ${product.name}`)

  try {
    state.loading = true
    const processed = {
      ...product,
      price: parsePrice(product.price)
    }

    const existingIndex = state.items.findIndex((i) => i.id === processed.id)
    addDebugInfo(`Product ${existingIndex !== -1 ? 'exists' : 'does not exist'} in cart`)

    if (userStore.isAuthenticated) {
      addDebugInfo('User is authenticated, adding to server cart')
      const resp = await axios.post(
        `${API_URL}/cart`,
        {
          productId: processed.id,
          quantity: product.quantity || 1, // Use specified quantity or default to 1
          price: processed.price,
          name: processed.name,
          image: processed.image || '/placeholder.jpg',
          priceUnit: processed.priceUnit || 'kus'
        },
        { headers: { Authorization: `Bearer ${userStore.token}` } }
      )

      if (resp.data.success) {
        addDebugInfo('Successfully added to server cart')
        if (existingIndex !== -1) {
          state.items[existingIndex].quantity += product.quantity || 1
          state.items[existingIndex].dbId = resp.data.cartItem.id
        } else {
          state.items.push({
            id: processed.id,
            name: processed.name,
            price: processed.price,
            image: processed.image || '/placeholder.jpg',
            priceUnit: processed.priceUnit || 'kus',
            quantity: product.quantity || 1,
            dbId: resp.data.cartItem.id
          })
        }
      } else {
        addDebugInfo('Server returned error when adding to cart')
      }
    } else {
      // guest user
      addDebugInfo('User is not authenticated, adding to local cart only')
      if (existingIndex !== -1) {
        state.items[existingIndex].quantity += product.quantity || 1
      } else {
        state.items.push({
          ...processed,
          quantity: product.quantity || 1,
          image: processed.image || '/placeholder.jpg',
          priceUnit: processed.priceUnit || 'kus'
        })
      }
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error adding to cart:', error)
    addDebugInfo(`Error adding to cart: ${error}`)
    state.error = 'Nepodařilo se přidat položku do košíku'
    state.loading = false
  }
}

// Other functions remain the same with added debug info
async function removeFromCart(index: number): Promise<void> {
  const userStore = useUserStore()
  addDebugInfo(`Removing item at index ${index} from cart`)

  try {
    state.loading = true
    if (userStore.isAuthenticated) {
      const item = state.items[index]
      if (item?.dbId) {
        addDebugInfo(`Removing item with dbId ${item.dbId} from server`)
        await axios.delete(`${API_URL}/cart/${item.dbId}`, {
          headers: { Authorization: `Bearer ${userStore.token}` }
        })
      }
    }
    state.items.splice(index, 1)
    addDebugInfo('Item removed from cart')

    if (!userStore.isAuthenticated) {
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error removing from cart:', error)
    addDebugInfo(`Error removing from cart: ${error}`)
    state.error = 'Nepodařilo se odstranit položku z košíku'
    state.loading = false
  }
}

async function updateQuantity(index: number, quantity: number): Promise<void> {
  const userStore = useUserStore()
  addDebugInfo(`Updating quantity for item at index ${index} to ${quantity}`)

  try {
    state.loading = true
    if (quantity < 1) quantity = 1

    if (userStore.isAuthenticated) {
      const item = state.items[index]
      if (item?.dbId) {
        addDebugInfo(`Updating item with dbId ${item.dbId} on server`)
        await axios.put(
          `${API_URL}/cart/${item.dbId}`,
          { quantity },
          { headers: { Authorization: `Bearer ${userStore.token}` } }
        )
      }
    }
    state.items[index].quantity = quantity
    addDebugInfo('Quantity updated')

    if (!userStore.isAuthenticated) {
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error updating quantity:', error)
    addDebugInfo(`Error updating quantity: ${error}`)
    state.error = 'Nepodařilo se aktualizovat množství položky'
    state.loading = false
  }
}

function increaseQuantity(index: number): void {
  updateQuantity(index, state.items[index].quantity + 1)
}

function decreaseQuantity(index: number): void {
  if (state.items[index].quantity > 1) {
    updateQuantity(index, state.items[index].quantity - 1)
  }
}

async function setShippingMethod(method: string): Promise<void> {
  const userStore = useUserStore()
  addDebugInfo(`Setting shipping method to ${method}`)

  try {
    state.loading = true
    state.shippingMethod = method

    if (userStore.isAuthenticated) {
      addDebugInfo('User is authenticated, updating shipping preference on server')
      try {
        await axios.put(
          `${API_URL}/user/preferences/shipping`,
          { shippingMethod: method },
          { headers: { Authorization: `Bearer ${userStore.token}` } }
        )
        addDebugInfo('Shipping preference updated on server')
      } catch (error) {
        addDebugInfo(`Failed to update shipping preference on server: ${error}`)
        // Continue even if the server update fails - we'll still keep the local preference
      }
    } else {
      addDebugInfo('User is not authenticated, saving shipping preference locally')
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error setting shipping method:', error)
    addDebugInfo(`Error setting shipping method: ${error}`)
    state.error = 'Nepodařilo se nastavit způsob dopravy'
    state.loading = false
  }
}

async function clearCart(): Promise<void> {
  const userStore = useUserStore()
  addDebugInfo('Clearing cart')

  try {
    state.loading = true
    if (userStore.isAuthenticated) {
      addDebugInfo(`Removing ${state.items.length} items from server cart`)
      for (const item of state.items) {
        if (item.dbId) {
          await axios.delete(`${API_URL}/cart/${item.dbId}`, {
            headers: { Authorization: `Bearer ${userStore.token}` }
          })
        }
      }
    }
    state.items = []
    addDebugInfo('Cart cleared')

    if (!userStore.isAuthenticated) {
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error clearing cart:', error)
    addDebugInfo(`Error clearing cart: ${error}`)
    state.error = 'Nepodařilo se vyčistit košík'
    state.loading = false
  }
}

// ========== COMPUTED PROPERTIES ==========

const cartTotal = computed<number>(() =>
  state.items.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0)
)

const shipping = computed<number>(() => (state.shippingMethod === 'delivery' ? 150 : 0))

const itemCount = computed<number>(() =>
  state.items.reduce((count, item) => count + item.quantity, 0)
)

// ========== MAIN EXPORT ==========

export function useCart() {
  // Ensure we initialize once
  if (!state.initialized) {
    initializeCart()
  }

  return {
    items: computed(() => state.items),
    itemCount,
    cartTotal,
    shipping,
    shippingMethod: computed(() => state.shippingMethod),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    debugInfo: computed(() => state.debugInfo),
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    setShippingMethod,
    clearCart,
    syncCartWithServer,
    loadLocalCart,
    loadServerCart,
    saveCart,
    initializeCart
  }
}
