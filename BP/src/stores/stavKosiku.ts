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
  // Added fields from the updated backend
  name?: string
  price?: string | number
  image?: string
  price_unit?: string
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

// New interfaces for delivery and order
interface DeliveryAddress {
  street: string
  city: string
  zip: string
  distance?: number
}

interface OrderDetails {
  name: string
  email: string
  phone: string
  company?: string
  ico?: string
  dic?: string
  pickupDate: string
  shippingMethod: 'pickup' | 'delivery'
  deliveryAddress?: DeliveryAddress
  deliveryCost: number
  note?: string
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

  // Shipping and order related state
  const shippingMethod = ref<'pickup' | 'delivery'>('pickup')
  const deliveryAddress = ref<DeliveryAddress | null>(null)
  const deliveryCost = ref(0)
  const deliveryDistance = ref(0)
  const lastOrderId = ref<number | null>(null)

  const userStore = useUserStore()
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://api.stavebninylysa.cz'
  // Format image URL function
  function formatImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) return '/placeholder.png'

    // If it's already a full URL, use it as is
    if (imageUrl.startsWith('http')) return imageUrl

    // Otherwise, prepend the base API URL for images
    return `${apiBaseUrl}/images/produkty/${imageUrl}`
  }

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
          // Transform server cart items to client format
          items.value = resp.data.cartItems.map((item: ServerCartItem) => {
            // Format the image URL
            let imageUrl = item.image
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = `https://api.stavebninylysa.cz/images/produkty/${imageUrl}`
            }

            return {
              id: item.product_id,
              quantity: item.quantity,
              dbId: item.id,
              name: item.name || `Produkt ${item.product_id}`,
              price: item.price || 0,
              image: imageUrl || '/placeholder.png',
              priceUnit: item.price_unit || 'kus'
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

      // Note: The backend now handles fetching product details, so we only need to send productId and quantity
      const resp = await axios.post(
        `${API_URL}/cart`,
        {
          productId: product.id,
          quantity
        },
        { headers: { Authorization: `Bearer ${userStore.token}` } }
      )

      if (resp.data.success) {
        // Check if we have a cartItem in the response
        if (resp.data.cartItem) {
          // Find if the item already exists in the cart
          const existingIndex = items.value.findIndex((item) => item.id === product.id)

          if (existingIndex !== -1) {
            // Update existing item
            items.value[existingIndex].quantity = resp.data.cartItem.quantity
          } else {
            // Add new item
            items.value.push({
              id: product.id,
              dbId: resp.data.cartItem.id,
              quantity: resp.data.cartItem.quantity,
              name: product.name,
              price: price,
              image: formatImageUrl(product.image),
              priceUnit: product.priceUnit || 'kus'
            })
          }
        } else {
          // If we don't have cartItem details, reload the entire cart
          await loadServerCart()
        }

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
        const response = await axios.put(
          `${API_URL}/cart/${item.dbId}`,
          { quantity },
          { headers: { Authorization: `Bearer ${userStore.token}` } }
        )

        // If we get updated item details back from the server, use them
        if (response.data.success && response.data.cartItem) {
          items.value[index].quantity = response.data.cartItem.quantity
        } else {
          items.value[index].quantity = quantity
        }
      } else {
        items.value[index].quantity = quantity
      }
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

  // Clear cart - updated to handle 404 errors gracefully
  // Clear cart - updated to handle 404 errors gracefully
  async function clearCart() {
    if (userStore.isAuthenticated && userStore.token && items.value.length > 0) {
      const deletePromises = items.value.map(async (item) => {
        if (item.dbId) {
          try {
            await axios.delete(`${API_URL}/cart/${item.dbId}`, {
              headers: { Authorization: `Bearer ${userStore.token}` }
            })
          } catch (error: any) {
            // Silently handle 404 errors (item already deleted by server)
            if (error.response && error.response.status === 404) {
              console.log(`Cart item ${item.dbId} was already deleted on server`)
            } else {
              console.error('Error clearing item from server:', error)
            }
          }
        }
      })

      // Wait for all delete operations to complete
      await Promise.allSettled(deletePromises)
    }

    // Clear items in the local state regardless of server success
    items.value = []
  }
  function setShippingMethod(method: 'pickup' | 'delivery') {
    shippingMethod.value = method

    // Reset delivery cost if switching to pickup
    if (method === 'pickup') {
      deliveryCost.value = 0
      deliveryDistance.value = 0
    }
  }
  // Set delivery address
  function setDeliveryAddress(address: DeliveryAddress) {
    deliveryAddress.value = address
  }

  // Calculate delivery cost based on distance
  function calculateDeliveryCost(distance: number) {
    deliveryDistance.value = distance

    // Base cost is 500 Kč + 30 Kč per km
    const baseCost = 500
    const costPerKm = 30
    deliveryCost.value = baseCost + costPerKm * distance

    return deliveryCost.value
  }

  // Create order
  async function createOrder(orderDetails: OrderDetails) {
    if (!userStore.isAuthenticated || !userStore.token) {
      console.warn('User not logged in. Cannot create order.')
      return { success: false, message: 'Pro vytvoření objednávky je nutné se přihlásit.' }
    }

    if (items.value.length === 0) {
      return { success: false, message: 'Košík je prázdný.' }
    }

    try {
      loading.value = true

      // Format order data for API
      const orderData = {
        items: items.value.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price:
            typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : item.price,
          name: item.name
        })),
        shipping: {
          method: orderDetails.shippingMethod,
          address: orderDetails.shippingMethod === 'delivery' ? orderDetails.deliveryAddress : null,
          cost: orderDetails.deliveryCost,
          pickupDate: orderDetails.pickupDate
        },
        customer: {
          name: orderDetails.name,
          email: orderDetails.email,
          phone: orderDetails.phone,
          company: orderDetails.company || null,
          ico: orderDetails.ico || null,
          dic: orderDetails.dic || null
        },
        note: orderDetails.note || null,
        total: cartTotal.value + orderDetails.deliveryCost
      }

      // Call API to create order
      // API endpoint for creating orders may need to be confirmed
      const resp = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${userStore.token}` }
      })

      if (resp.data.success) {
        // Store the order ID for reference
        lastOrderId.value = resp.data.orderId || null

        // Clear the cart after successful order
        await clearCart()

        return {
          success: true,
          orderId: resp.data.orderId,
          message: 'Objednávka byla úspěšně vytvořena.'
        }
      } else {
        return {
          success: false,
          message: resp.data.message || 'Nepodařilo se vytvořit objednávku.'
        }
      }
    } catch (err: any) {
      console.error('Error creating order:', err)
      error.value = 'Nepodařilo se vytvořit objednávku'
      return {
        success: false,
        message:
          err.response?.data?.message ||
          'Nepodařilo se vytvořit objednávku. Zkuste to prosím znovu později.'
      }
    } finally {
      loading.value = false
    }
  }

  // Computed
  const itemCount = computed(() => items.value.reduce((count, item) => count + item.quantity, 0))
  const cartTotal = computed(() => {
    return items.value.reduce((total, item) => {
      // Get the numeric price value
      let priceNum = 0

      if (typeof item.price === 'number') {
        priceNum = item.price
      } else if (typeof item.price === 'string') {
        // Handle both comma and period as decimal separators
        priceNum = parseFloat(item.price.replace(',', '.'))
      }

      // Ensure it's a valid number
      if (isNaN(priceNum)) {
        console.warn(`Invalid price format for item ${item.id}: ${item.price}`)
        priceNum = 0
      }

      return total + priceNum * item.quantity
    }, 0)
  })

  // Return everything
  return {
    items,
    shippingMethod,
    deliveryAddress,
    deliveryCost,
    deliveryDistance,
    lastOrderId,
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
    setShippingMethod,
    setDeliveryAddress,
    calculateDeliveryCost,
    createOrder
  }
})
