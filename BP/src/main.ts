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
      // 1) Merge the guest cart into the server cart
      await cartStore.syncCartWithServer()

      // 2) Clear the guest cart so it doesn't keep re-syncing
      localStorage.removeItem('kosik_guest')

      // 3) Load the user’s DB cart
      await cartStore.loadServerCart()
    } else if (!isAuthenticated && wasAuthenticated) {
      // The user just logged out
      // Revert to guest cart in localStorage
      cartStore.loadLocalCart()
    }
  }
)
