// main.ts
import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useCart } from '@/stores/stavKosiku.ts'
import { useUserStore } from './stores/index'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

// Now that Pinia is created, get the stores:
const userStore = useUserStore(pinia)
const cartStore = useCart()

// Add a logging helper
function logEvent(message: string): void {
  console.log(`[AUTH FLOW] ${message}`)
}

// Force clear old cart data from localStorage if needed
try {
  localStorage.removeItem('cart')
  localStorage.removeItem('cart_2')
  localStorage.removeItem('shippingMethod')
  localStorage.removeItem('shipping_2')
} catch (e) {
  console.error('Error clearing old cart data:', e)
}

// Watch for login/logout changes:
watch(
  () => userStore.isAuthenticated,
  async (isAuthenticated, wasAuthenticated) => {
    logEvent(`Auth state changed: ${wasAuthenticated} -> ${isAuthenticated}`)

    if (isAuthenticated && !wasAuthenticated) {
      // The user just logged in
      logEvent('User just logged in')

      // First, check if there's a guest cart to merge
      const guestCartData = localStorage.getItem('kosik_guest')

      if (guestCartData) {
        try {
          // Parse the guest cart
          const guestCart = JSON.parse(guestCartData)

          // Only proceed if there are items to sync
          if (guestCart.items && guestCart.items.length > 0) {
            logEvent(`Found guest cart with ${guestCart.items.length} items to sync`)

            // Set the items directly in the state
            // We access the state directly and not through computed properties
            logEvent('Setting guest cart items to state')
            // This is handled in the syncCartWithServer function

            // Then sync with the server
            logEvent('Syncing guest cart with server')
            await cartStore.syncCartWithServer()

            // Remove the guest cart after successful sync
            localStorage.removeItem('kosik_guest')
            logEvent('Guest cart synced and removed')
          } else {
            logEvent('Guest cart is empty, nothing to sync')
          }
        } catch (error) {
          console.error('Error syncing guest cart:', error)
          logEvent(`Error syncing guest cart: ${error}`)
        }
      } else {
        logEvent('No guest cart found')
      }

      // Then explicitly reload the user's server cart
      logEvent('Loading server cart after login')
      await cartStore.loadServerCart()

      // Finally, check for any saved previous user cart
      if (userStore.user?.id) {
        const userCartKey = `kosik_${userStore.user.id}`
        const savedUserCartData = localStorage.getItem(userCartKey)

        if (savedUserCartData) {
          try {
            // Parse the saved user cart
            const savedUserCart = JSON.parse(savedUserCartData)

            // Only proceed if there are items to merge
            if (savedUserCart.items && savedUserCart.items.length > 0) {
              logEvent(`Found saved user cart with ${savedUserCart.items.length} items to merge`)

              // Add these items to the server one by one
              for (const item of savedUserCart.items) {
                await cartStore.addToCart({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  image: item.image || '/placeholder.jpg',
                  priceUnit: item.priceUnit || 'kus',
                  quantity: item.quantity || 1
                })
              }

              // Remove the saved user cart after merging
              localStorage.removeItem(userCartKey)
              logEvent('Saved user cart merged and removed')
            } else {
              logEvent('Saved user cart is empty, nothing to merge')
            }
          } catch (error) {
            console.error('Error merging saved user cart:', error)
            logEvent(`Error merging saved user cart: ${error}`)
          }
        } else {
          logEvent('No saved user cart found')
        }
      }
    } else if (!isAuthenticated && wasAuthenticated) {
      // The user just logged out
      logEvent('User just logged out')

      // Save the current cart state before clearing
      if (userStore.user?.id) {
        const userCartKey = `kosik_${userStore.user.id}`

        // Get current cart items and shipping method
        // Need to be careful with TypeScript and computed properties
        const items = cartStore.items.value
        const shippingMethod = cartStore.shippingMethod.value

        logEvent(`Saving ${items.length} items to user cart before logout`)

        // Save the current state for this user
        localStorage.setItem(
          userCartKey,
          JSON.stringify({
            items: items,
            shippingMethod: shippingMethod || 'pickup'
          })
        )

        logEvent(`User cart saved with key ${userCartKey}`)
      }

      // Clear in-memory cart
      await cartStore.clearCart()
      logEvent('Cart cleared after logout')

      // Explicitly load the guest cart
      await cartStore.loadLocalCart()
      logEvent('Guest cart loaded after logout')
    }
  }
)

// Also watch for changes in userId to handle refresh cases
watch(
  () => userStore.user?.id,
  async (newUserId, oldUserId) => {
    if (newUserId && newUserId !== oldUserId) {
      logEvent(`User ID changed: ${oldUserId} -> ${newUserId}`)

      // Re-initialize the cart when user ID changes (e.g. after page refresh)
      await cartStore.initializeCart()
    }
  },
  { immediate: true }
)
