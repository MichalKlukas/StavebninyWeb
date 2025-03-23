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

// Watch for login/logout changes:
watch(
  () => userStore.isAuthenticated,
  async (isAuthenticated, wasAuthenticated) => {
    if (isAuthenticated && !wasAuthenticated) {
      // The user just logged in

      // First load the server cart to see what's already there
      await cartStore.loadServerCart()

      // Then check for a guest cart
      const guestCart = localStorage.getItem('kosik_guest')
      if (guestCart && JSON.parse(guestCart).items?.length > 0) {
        // If we have guest items, sync them with server
        await cartStore.syncCartWithServer()
        // Clean up the guest cart
        localStorage.removeItem('kosik_guest')
      }

      // Finally, check for a previously saved user cart from a prior session
      if (userStore.user) {
        const userCartKey = `kosik_${userStore.user.id}`
        const savedUserCart = localStorage.getItem(userCartKey)

        if (savedUserCart) {
          const parsedCart = JSON.parse(savedUserCart)

          // Only process if there are items to merge
          if (parsedCart.items && parsedCart.items.length > 0) {
            // We need to merge these saved items with what's already been loaded
            // For simplicity, let's just add each item to the cart
            for (const item of parsedCart.items) {
              try {
                await cartStore.addToCart({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  image: item.image,
                  priceUnit: item.priceUnit,
                  quantity: item.quantity
                })
              } catch (error) {
                console.error('Error adding saved item to cart:', error)
              }
            }

            // Clean up after successful merge
            localStorage.removeItem(userCartKey)
          }
        }
      }
    } else if (!isAuthenticated && wasAuthenticated) {
      // The user just logged out
      // Save the current cart state before clearing
      if (userStore.user) {
        const userCartKey = `kosik_${userStore.user.id}`

        // Get the current cart state
        localStorage.setItem(
          userCartKey,
          JSON.stringify({
            items: cartStore.items.value, // Make sure to use .value since these are computed refs
            shippingMethod: cartStore.shippingMethod.value
          })
        )
      }

      // Clear in-memory cart and load guest cart if exists
      await cartStore.clearCart()
      await cartStore.loadLocalCart() // This will load any existing guest cart
    }
  }
)
