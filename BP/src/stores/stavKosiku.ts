// src/stores/stavKosiku.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { useUserStore } from './index'
import { computed, ref } from 'vue'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'
const API_URL = `${BASE_URL}/api`

// Define interface for cart items from server
interface ServerCartItem {
  id: number
  product_id: number
  quantity: number
  created_at: string
  updated_at: string
}

interface CartItem {
  id: number
  quantity: number
  dbId?: number
  name: string
  price: number | string
  image: string
  priceUnit: string
}
const getProductCache = () => {
  try {
    const cache = localStorage.getItem('product_cache')
    return cache ? JSON.parse(cache) : {}
  } catch (e) {
    console.error('Error loading product cache:', e)
    return {}
  }
}
const saveProductCache = (cache: Record<string, any>) => {
  try {
    localStorage.setItem('product_cache', JSON.stringify(cache))
  } catch (e) {
    console.error('Error saving product cache:', e)
  }
}
export const useCart = defineStore('cart', () => {
  // Reactive state
  const items = ref<CartItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const addSuccess = ref(false) // New state for tracking add success

  // ** Add shippingMethod here **
  const shippingMethod = ref<'pickup' | 'delivery'>('pickup')

  const userStore = useUserStore()

  // Load the server cart (only if logged in)
  // Load the server cart (only if logged in)
  async function loadServerCart() {
    if (!userStore.isAuthenticated || !userStore.token) {
      items.value = []
      return
    }
    try {
      loading.value = true
      console.log('Loading server cart...')

      const resp = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${userStore.token}` }
      })

      console.log('Server cart response:', resp.data)

      if (resp.data.success) {
        if (resp.data.cartItems && resp.data.cartItems.length > 0) {
          // Get product cache
          const cache = getProductCache()

          // Transform server cart items to client format
          items.value = resp.data.cartItems.map((item: ServerCartItem) => {
            const productId = item.product_id
            const cachedProduct = cache[productId] || {}

            return {
              id: productId,
              quantity: item.quantity,
              dbId: item.id,
              name: cachedProduct.name || `Produkt ${productId}`,
              price: cachedProduct.price || 0,
              image: cachedProduct.image || '/placeholder.jpg',
              priceUnit: cachedProduct.priceUnit || 'kus'
            } as CartItem
          })

          console.log('Cart loaded with items:', items.value)
        } else {
          console.log('Cart is empty')
          items.value = []
        }
      }
    } catch (err) {
      console.error('Error loading server cart:', err)
      error.value = 'Nepodařilo se načíst košík'
    } finally {
      loading.value = false
    }
  }

  // Add item to cart (login required)
  async function addToCart(product: any) {
    if (!userStore.isAuthenticated || !userStore.token) {
      console.warn('User not logged in. Cannot add to cart.')
      return false
    }

    try {
      loading.value = true
      const quantity = product.quantity || 1

      // Format price correctly - handle both comma and period formats
      let price = product.price
      if (typeof price === 'string') {
        // Replace comma with period for server processing
        price = price.replace(',', '.')
      }

      console.log(`Adding to cart: ${product.id}, price: ${price}, quantity: ${quantity}`)

      // Save product details to cache
      const cache = getProductCache()
      cache[product.id] = {
        name: product.name,
        price: price,
        image: product.image || '/placeholder.jpg',
        priceUnit: product.priceUnit || 'kus'
      }
      saveProductCache(cache)

      const resp = await axios.post(
        `${API_URL}/cart`,
        {
          productId: product.id,
          quantity,
          price,
          name: product.name,
          image: product.image || '/placeholder.jpg',
          priceUnit: product.priceUnit || 'kus'
        },
        { headers: { Authorization: `Bearer ${userStore.token}` } }
      )

      if (resp.data.success) {
        // Reload the entire cart
        await loadServerCart()
        addSuccess.value = true

        // Reset success flag after 3 seconds
        setTimeout(() => {
          addSuccess.value = false
        }, 3000)

        return true
      }
    } catch (err) {
      console.error('Error adding to cart:', err)
      error.value = 'Nepodařilo se přidat do košíku'
      return false
    } finally {
      loading.value = false
    }

    return false
  }

  // Remove item
  async function removeFromCart(index: number) {
    if (!userStore.isAuthenticated || !userStore.token) return
    try {
      loading.value = true
      const item = items.value[index]
      if (item?.dbId) {
        await axios.delete(`${API_URL}/cart/${item.dbId}`, {
          headers: { Authorization: `Bearer ${userStore.token}` }
        })
      }
      items.value.splice(index, 1)
    } catch (err) {
      console.error('Error removing from cart:', err)
      error.value = 'Nepodařilo se odstranit položku z košíku'
    } finally {
      loading.value = false
    }
  }

  // Update quantity
  async function updateQuantity(index: number, quantity: number) {
    if (!userStore.isAuthenticated || !userStore.token) return
    if (quantity < 1) quantity = 1
    try {
      loading.value = true
      const item = items.value[index]
      if (item?.dbId) {
        await axios.put(
          `${API_URL}/cart/${item.dbId}`,
          { quantity },
          { headers: { Authorization: `Bearer ${userStore.token}` } }
        )
      }
      items.value[index].quantity = quantity
    } catch (err) {
      console.error('Error updating quantity:', err)
      error.value = 'Nepodařilo se aktualizovat množství'
    } finally {
      loading.value = false
    }
  }

  // Helper methods for kosik.vue
  function increaseQuantity(index: number) {
    if (index >= 0 && index < items.value.length) {
      updateQuantity(index, items.value[index].quantity + 1)
    }
  }

  function decreaseQuantity(index: number) {
    if (index >= 0 && index < items.value.length && items.value[index].quantity > 1) {
      updateQuantity(index, items.value[index].quantity - 1)
    }
  }

  // Clear cart
  async function clearCart() {
    if (userStore.isAuthenticated && userStore.token && items.value.length > 0) {
      for (const item of items.value) {
        if (item.dbId) {
          try {
            await axios.delete(`${API_URL}/cart/${item.dbId}`, {
              headers: { Authorization: `Bearer ${userStore.token}` }
            })
          } catch (err) {
            console.error('Error clearing item from server:', err)
          }
        }
      }
    }
    items.value = []
  }

  // ** Set shipping method **
  async function setShippingMethod(method: 'pickup' | 'delivery') {
    shippingMethod.value = method
    // We're not syncing with server since the endpoint doesn't exist
  }

  // Computed
  const itemCount = computed(() => items.value.reduce((count, item) => count + item.quantity, 0))
  const cartTotal = computed(() => {
    return items.value.reduce((total, item) => {
      // Handle Czech number format (comma as decimal separator)
      let priceNum = 0
      if (typeof item.price === 'number') {
        priceNum = item.price
      } else if (typeof item.price === 'string') {
        // Replace comma with period for parsing
        priceNum = parseFloat(item.price.replace(',', '.'))
      }

      if (isNaN(priceNum)) {
        console.warn(`Invalid price format: ${item.price}`)
        priceNum = 0
      }

      return total + priceNum * item.quantity
    }, 0)
  })

  // Return everything
  return {
    items,
    shippingMethod,
    loading,
    error,
    addSuccess,
    itemCount,
    cartTotal,
    loadServerCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    setShippingMethod
  }
})
