// main.ts
import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Import your user store and cart store
import { useUserStore } from '@/stores'
import { useCart } from '@/stores/stavKosiku'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

// Now that Pinia is created, get the stores:
const userStore = useUserStore(pinia)
const cartStore = useCart(pinia)

// Watch for login/logout changes:
watch(
  () => userStore.isAuthenticated,
  async (isAuthenticated, wasAuthenticated) => {
    if (isAuthenticated && !wasAuthenticated) {
      // User just logged in: load their server cart
      await cartStore.loadServerCart()
    } else if (!isAuthenticated && wasAuthenticated) {
      // User just logged out: clear the cart
      await cartStore.clearCart()
    }
  },
  { immediate: true }
)
