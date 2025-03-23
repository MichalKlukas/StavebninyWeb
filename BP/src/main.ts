// main.ts
import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useCart } from '@/stores/stavKosiku.ts'
// Import your cart store and user store

import { useUserStore } from './stores/index' // or './stores/user' if you separate them

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

      // 1) Merge guest cart first (if any)
      const guestCart = localStorage.getItem('anonymous_cart') // adjust if you use a different guest key
      if (guestCart) {
        await cartStore.syncCartWithServer()
        localStorage.removeItem('anonymous_cart')
      }

      // 2) Check if there is a saved user cart (from a previous session)
      if (userStore.user) {
        const userCartKey = `cart_${userStore.user.id}` // adjust as needed
        const savedUserCart = localStorage.getItem(userCartKey)
        if (savedUserCart) {
          // Optionally merge the saved user cart with the server cart.
          // You can implement a merge function here if you want to add quantities, etc.
        }
      }

      // 3) Load the user’s DB cart
      await cartStore.loadServerCart()
    } else if (!isAuthenticated && wasAuthenticated) {
      // The user just logged out
      if (userStore.user) {
        const userCartKey = `cart_${userStore.user.id}` // adjust as needed
        // Save the current cart using computed properties from cartStore.
        localStorage.setItem(
          userCartKey,
          JSON.stringify({
            items: cartStore.items, // if these are refs, you might need .value
            shippingMethod: cartStore.shippingMethod
          })
        )
      }
      // Clear the in-memory cart (or, if you prefer, load the guest cart)
      await cartStore.clearCart() // make sure clearCart is awaited if it performs async tasks
      // Optionally, you could load the guest cart:
      // await cartStore.loadLocalCart()
    }
  }
)
