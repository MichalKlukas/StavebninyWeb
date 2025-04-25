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
router.afterEach((to) => {
  const defaultTitle = 'Stavebniny Lysá'
  const defaultDescription =
    'Široký sortiment stavebních materiálů v Lysé nad Labem. Hrubá stavba, fasáda, dřevo, železo, barvy, elektro, chemie a další. Osobní odběr, odborné poradenství.'

  // Najdi meta.title v poslední matched routě
  const nearestWithTitle = to.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.title)
  document.title =
    nearestWithTitle && nearestWithTitle.meta.title
      ? (nearestWithTitle.meta.title as string)
      : defaultTitle

  // Najdi meta.description v poslední matched routě
  const nearestWithDesc = to.matched
    .slice()
    .reverse()
    .find((r) => r.meta && r.meta.description)
  let meta = document.querySelector('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)
  }
  meta.setAttribute(
    'content',
    nearestWithDesc && nearestWithDesc.meta.description
      ? (nearestWithDesc.meta.description as string)
      : defaultDescription
  )
})

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
