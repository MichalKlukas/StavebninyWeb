// src/stores/stavKosiku.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { useUserStore } from './index'
import { computed, ref } from 'vue'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'
const API_URL = `${BASE_URL}/api`

interface CartItem {
  id: number
  quantity: number
  dbId?: number
  name: string
  price: number | string
  image: string
  priceUnit: string
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
  async function loadServerCart() {
    if (!userStore.isAuthenticated || !userStore.token) {
      items.value = []
      return
    }
    try {
      loading.value = true
      const resp = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${userStore.token}` }
      })
      if (resp.data.success) {
        items.value = resp.data.cartItems.map((item: any) => ({
          id: item.product_id,
          quantity: item.quantity,
          dbId: item.id,
          name: item.product_name || `Produkt ${item.product_id}`,
          price: item.product_price || 0,
          image: item.product_image || '/placeholder.jpg',
          priceUnit: item.product_unit || 'kus'
        }))
      }
      // Optionally fetch user's preferred shipping method from the server:
      try {
        const prefsResp = await axios.get(`${API_URL}/user/preferences/shipping`, {
          headers: { Authorization: `Bearer ${userStore.token}` }
        })
        if (prefsResp.data.success && prefsResp.data.shippingMethod) {
          shippingMethod.value = prefsResp.data.shippingMethod
        }
      } catch (err) {
        console.warn('Failed to load shipping preferences, using default pickup.')
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
      return false // Return false to indicate failure
    }

    try {
      loading.value = true
      const quantity = product.quantity || 1

      // Format price if it's a string with "Kč/"
      let price = product.price
      if (typeof price === 'string' && price.includes('Kč/')) {
        price = price.split('Kč/')[0].trim()
      }

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

        return true // Return true to indicate success
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
    if (userStore.isAuthenticated) {
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
    // If user is logged in, optionally update server preference
    if (userStore.isAuthenticated && userStore.token) {
      try {
        await axios.put(
          `${API_URL}/user/preferences/shipping`,
          { shippingMethod: method },
          { headers: { Authorization: `Bearer ${userStore.token}` } }
        )
      } catch (err) {
        console.error('Error updating shipping method on server:', err)
      }
    }
  }

  // Computed
  const itemCount = computed(() => items.value.reduce((count, item) => count + item.quantity, 0))
  const cartTotal = computed(() => {
    return items.value.reduce((total, item) => {
      const priceNum = typeof item.price === 'number' ? item.price : parseFloat(item.price)
      return total + priceNum * item.quantity
    }, 0)
  })

  // Return everything
  return {
    items,
    shippingMethod,
    loading,
    error,
    addSuccess, // Expose the new success state
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
