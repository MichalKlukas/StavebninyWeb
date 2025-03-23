// src/stores/stavKosiku.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { useUserStore } from './index'
import { computed, ref } from 'vue'

interface CartItem {
  id: number
  quantity: number
  dbId?: number
  name: string
  price: number | string
  image: string
  priceUnit: string
}

const BASE_URL = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'
const API_URL = `${BASE_URL}/api`

export const useCart = defineStore('cart', () => {
  // Reactive state
  const items = ref<CartItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // User store
  const userStore = useUserStore()

  // ====== ACTIONS ======

  // Load the cart from the server (only if logged in)
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
    } catch (err) {
      console.error('Error loading server cart:', err)
      error.value = 'Nepodařilo se načíst košík'
    } finally {
      loading.value = false
    }
  }

  // Add an item to the server cart (only if logged in)
  async function addToCart(product: any) {
    if (!userStore.isAuthenticated || !userStore.token) {
      // user not logged in, do nothing or show error
      console.warn('User not logged in. Cannot add to cart.')
      return
    }
    try {
      loading.value = true
      const quantity = product.quantity || 1
      const resp = await axios.post(
        `${API_URL}/cart`,
        {
          productId: product.id,
          quantity,
          price: product.price,
          name: product.name,
          image: product.image || '/placeholder.jpg',
          priceUnit: product.priceUnit || 'kus'
        },
        { headers: { Authorization: `Bearer ${userStore.token}` } }
      )
      if (resp.data.success) {
        // Option 1: Reload the entire cart
        await loadServerCart()
      }
    } catch (err) {
      console.error('Error adding to cart:', err)
      error.value = 'Nepodařilo se přidat do košíku'
    } finally {
      loading.value = false
    }
  }

  // Remove item from server cart
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

  // Update quantity on server
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
      console.error('Error updating cart item:', err)
      error.value = 'Nepodařilo se aktualizovat množství'
    } finally {
      loading.value = false
    }
  }

  // Clear the server cart (if you want to remove items from DB) or just clear local
  async function clearCart() {
    if (userStore.isAuthenticated) {
      // Optionally remove each item from the server
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

  // ====== GETTERS ======
  const itemCount = computed(() => items.value.reduce((count, item) => count + item.quantity, 0))
  const cartTotal = computed(() => {
    return items.value.reduce((total, item) => {
      const priceNum = typeof item.price === 'number' ? item.price : parseFloat(item.price)
      return total + priceNum * item.quantity
    }, 0)
  })

  // Return everything needed
  return {
    items,
    loading,
    error,
    itemCount,
    cartTotal,
    loadServerCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  }
})
