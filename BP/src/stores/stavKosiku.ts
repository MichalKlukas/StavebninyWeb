// src/stores/stavKosiku.ts
import { reactive, computed } from 'vue'
import axios from 'axios'
import { useUserStore } from './index' // your user store file

// ========== TYPES ==========

// Single cart item shape
interface CartItem {
  id: number
  quantity: number
  dbId?: number
  name: string
  price: number | string
  image: string
  priceUnit: string
}

// The reactive state shape
interface CartState {
  items: CartItem[]
  shippingMethod: string
  loading: boolean
  error: string | null
  initialized: boolean
}

// For the "product" param in addToCart, we can keep it minimal with "any"
// or define a real interface if you know the shape.
type Product = any

// ========== CONSTANTS ==========

const BASE_URL = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'
const API_URL = `${BASE_URL}/api`

// ========== HELPERS ==========

// Convert price from string or number to a float
function parsePrice(priceString: number | string): number {
  if (typeof priceString === 'number') return priceString
  if (typeof priceString === 'string') {
    let cleanPrice = priceString.replace(/[^\d,\.]/g, '')
    cleanPrice = cleanPrice.replace(',', '.')
    return parseFloat(cleanPrice) || 0
  }
  return 0
}

// Return "kosik_guest" if not logged in, else "kosik_{userId}"
function getLocalCartKey(): string {
  const userStore = useUserStore()
  return userStore.isAuthenticated && userStore.user?.id
    ? `kosik_${userStore.user.id}`
    : 'kosik_guest'
}

// ========== REACTIVE STATE ==========

const state = reactive<CartState>({
  items: [],
  shippingMethod: 'pickup',
  loading: false,
  error: null,
  initialized: false
})

// ========== MAIN FUNCTIONS ==========

// 1. Initialize the cart
async function initializeCart(): Promise<void> {
  if (state.initialized) return
  state.initialized = true

  const userStore = useUserStore()
  try {
    state.loading = true
    loadLocalCart()

    if (userStore.isAuthenticated) {
      try {
        const resp = await axios.get(`${API_URL}/cart/status`)
        if (resp.data.success) {
          await loadServerCart()
        }
      } catch (err) {
        console.error('Cart API status check failed:', err)
      }
    }
    state.loading = false
  } catch (error) {
    console.error('Error initializing cart:', error)
    state.error = 'Nepodařilo se načíst košík'
    state.loading = false
  }
}

// 2. Load from localStorage
function loadLocalCart(): void {
  try {
    const savedCart = localStorage.getItem(getLocalCartKey())
    if (savedCart) {
      const parsed = JSON.parse(savedCart)
      state.items = parsed.items || []
      state.shippingMethod = parsed.shippingMethod || 'pickup'
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error)
    state.error = 'Nepodařilo se načíst košík z lokálního úložiště'
    state.items = []
    state.shippingMethod = 'pickup'
  }
}

// 3. Load from server
async function loadServerCart(): Promise<void> {
  const userStore = useUserStore()
  if (!userStore.isAuthenticated || !userStore.token) return

  try {
    const response = await axios.get(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    if (response.data.success) {
      state.items = response.data.cartItems.map((item: any) => ({
        id: item.product_id,
        quantity: item.quantity,
        dbId: item.id,
        name: item.product_name || 'Produktové ID: ' + item.product_id,
        price: item.product_price || '0',
        image: item.product_image || '/placeholder.jpg',
        priceUnit: item.product_unit || 'kus'
      }))
      // Also load shipping preferences
      try {
        const prefs = await axios.get(`${API_URL}/user/preferences/shipping`, {
          headers: { Authorization: `Bearer ${userStore.token}` }
        })
        if (prefs.data.success) {
          state.shippingMethod = prefs.data.shippingMethod
        }
      } catch (err) {
        console.error('Error loading shipping preferences:', err)
      }
    }
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
    }
    console.error('Error loading cart from server:', error)
    throw error
  }
}

// 4. Save cart to localStorage (for guests)
async function saveCart(): Promise<void> {
  const userStore = useUserStore()
  try {
    if (!userStore.isAuthenticated) {
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

// 5. Sync local guest cart with server
async function syncCartWithServer(): Promise<void> {
  const userStore = useUserStore()
  if (!userStore.isAuthenticated) return

  try {
    state.loading = true
    const localItems = state.items

    await axios.post(
      `${API_URL}/cart/sync`,
      { items: localItems },
      { headers: { Authorization: `Bearer ${userStore.token}` } }
    )

    await loadServerCart()
    localStorage.removeItem(getLocalCartKey())

    state.loading = false
  } catch (error) {
    console.error('Error syncing cart with server:', error)
    state.error = 'Nepodařilo se synchronizovat košík se serverem'
    state.loading = false
  }
}

// 6. Add to cart
async function addToCart(product: Product): Promise<void> {
  const userStore = useUserStore()
  try {
    state.loading = true
    const processed = {
      ...product,
      price: parsePrice(product.price)
    }

    const existingIndex = state.items.findIndex((i) => i.id === processed.id)

    if (userStore.isAuthenticated) {
      const resp = await axios.post(
        `${API_URL}/cart`,
        {
          productId: processed.id,
          quantity: 1,
          price: processed.price,
          name: processed.name,
          image: processed.image || '/placeholder.jpg',
          priceUnit: processed.priceUnit || 'kus'
        },
        { headers: { Authorization: `Bearer ${userStore.token}` } }
      )
      if (resp.data.success) {
        if (existingIndex !== -1) {
          state.items[existingIndex].quantity++
          state.items[existingIndex].dbId = resp.data.cartItem.id
        } else {
          state.items.push({
            id: processed.id,
            name: processed.name,
            price: processed.price,
            image: processed.image || '/placeholder.jpg',
            priceUnit: processed.priceUnit || 'kus',
            quantity: 1,
            dbId: resp.data.cartItem.id
          })
        }
      }
    } else {
      // guest
      if (existingIndex !== -1) {
        state.items[existingIndex].quantity++
      } else {
        state.items.push({
          ...processed,
          quantity: 1,
          image: processed.image || '/placeholder.jpg',
          priceUnit: processed.priceUnit || 'kus'
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

// 7. Remove from cart
async function removeFromCart(index: number): Promise<void> {
  const userStore = useUserStore()
  try {
    state.loading = true
    if (userStore.isAuthenticated) {
      const item = state.items[index]
      if (item?.dbId) {
        await axios.delete(`${API_URL}/cart/${item.dbId}`, {
          headers: { Authorization: `Bearer ${userStore.token}` }
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

// 8. Update quantity
async function updateQuantity(index: number, quantity: number): Promise<void> {
  const userStore = useUserStore()
  try {
    state.loading = true
    if (quantity < 1) quantity = 1

    if (userStore.isAuthenticated) {
      const item = state.items[index]
      if (item?.dbId) {
        await axios.put(
          `${API_URL}/cart/${item.dbId}`,
          { quantity },
          { headers: { Authorization: `Bearer ${userStore.token}` } }
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

function increaseQuantity(index: number): void {
  updateQuantity(index, state.items[index].quantity + 1)
}
function decreaseQuantity(index: number): void {
  if (state.items[index].quantity > 1) {
    updateQuantity(index, state.items[index].quantity - 1)
  }
}

// 9. Set shipping method
async function setShippingMethod(method: string): Promise<void> {
  const userStore = useUserStore()
  try {
    state.loading = true
    state.shippingMethod = method

    if (userStore.isAuthenticated) {
      await axios.put(
        `${API_URL}/user/preferences/shipping`,
        { shippingMethod: method },
        { headers: { Authorization: `Bearer ${userStore.token}` } }
      )
    } else {
      await saveCart()
    }
    state.loading = false
  } catch (error) {
    console.error('Error setting shipping method:', error)
    state.error = 'Nepodařilo se nastavit způsob dopravy'
    state.loading = false
  }
}

// 10. Clear the cart
async function clearCart(): Promise<void> {
  const userStore = useUserStore()
  try {
    state.loading = true
    if (userStore.isAuthenticated) {
      for (const item of state.items) {
        if (item.dbId) {
          await axios.delete(`${API_URL}/cart/${item.dbId}`, {
            headers: { Authorization: `Bearer ${userStore.token}` }
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

// ========== COMPUTED PROPERTIES ==========

const cartTotal = computed<number>(() =>
  state.items.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0)
)

const shipping = computed<number>(() => (state.shippingMethod === 'delivery' ? 150 : 0))

const itemCount = computed<number>(() =>
  state.items.reduce((count, item) => count + item.quantity, 0)
)

// ========== MAIN EXPORT ==========

// We export a function returning all the cart logic.
// In Pinia style, you might defineStore, but this is fine for a composable.
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
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    setShippingMethod,
    clearCart,
    syncCartWithServer,
    loadLocalCart,
    loadServerCart
  }
}
