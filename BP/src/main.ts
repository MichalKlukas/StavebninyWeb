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
      const guestCart = localStorage.getItem('kosik_guest')
      if (guestCart) {
        await cartStore.syncCartWithServer()
        localStorage.removeItem('kosik_guest')
      }

      // 2) Check if there is a saved user cart (from a previous session)
      if (userStore.user) {
        const userCartKey = `kosik_${userStore.user.id}`
        const savedUserCart = localStorage.getItem(userCartKey)
        if (savedUserCart) {
          // Optionally merge the saved user cart with the server cart
          // This could be a separate function that compares quantities, etc.
        }
      }

      // 3) Load the user’s DB cart
      await cartStore.loadServerCart()
    } else if (!isAuthenticated && wasAuthenticated) {
      // The user just logged out
      if (userStore.user) {
        const userCartKey = `kosik_${userStore.user.id}`
        // Use the computed properties from cartStore instead of direct state access
        localStorage.setItem(
          userCartKey,
          JSON.stringify({
            items: cartStore.items, // or cartStore.items.value if needed
            shippingMethod: cartStore.shippingMethod // or .value if required
          })
        )
      }
      // Clear the cart (or load guest cart if needed)
      cartStore.clearCart()
      // Optionally, you can call cartStore.loadLocalCart() if you'd like to switch to the guest cart immediately.
    }
  }
)
