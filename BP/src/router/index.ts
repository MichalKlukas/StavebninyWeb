import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'

import AboutView from '@/views/AboutView.vue'
import FaqPage from '@/views/mateDotaz.vue'
import PoptavkaPage from '@/views/Poptávka.vue'
import CategoryPage from '@/views/CategoryPage.vue'
import Prihlaseni from '@/views/prihlaseni.vue'
import Registrace from '@/views/registrace.vue'
import OvereniMailu from '@/views/overeniMailu.vue'
import MujProfil from '@/views/mujProfil.vue'
import MojeObjednavky from '@/views/mojeObjednavky.vue'
import ZmenaHesla from '@/views/zmenaHesla.vue'
import UpravitProfil from '@/views/upravitProfil.vue'
import Kategorie from '@/views/CategoryPage.vue'
import Kosik from '@/views/kosik.vue'
import ResetHesla from '@/views/resetHesla.vue'
import SearchResults from '@/views/searchResults.vue'
import GoogleCallback from '@/views/googleCallback.vue'

// Import stores for initialization
import { useUserStore } from '@/stores/useUserStore.js'
import { useCartStore } from '@/stores/cartStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/auth/google/callback',
      name: 'GoogleCallback',
      component: GoogleCallback
    },
    {
      path: '/search',
      name: 'SearchResults',
      component: SearchResults
    },
    {
      path: '/reset-password/:token',
      name: 'ResetHesla',
      component: ResetHesla
    },
    {
      path: '/upravit-profil',
      name: 'upravitProfil',
      component: UpravitProfil
    },
    {
      path: '/objednavky',
      name: 'objednavky',
      component: MojeObjednavky
    },
    {
      path: '/zmena-hesla',
      name: 'zmenaHesla',
      component: ZmenaHesla
    },
    {
      path: '/cart',
      name: 'cart',
      component: Kosik
    },
    {
      path: '/kategorie/:id',
      name: 'kategorie',
      component: Kategorie
    },
    {
      path: '/o-nas',
      name: 'about',
      component: AboutView
    },
    {
      path: '/profil',
      name: 'profil',
      component: MujProfil
    },
    {
      path: '/verify-email/:token',
      name: 'VerifyEmail',
      component: OvereniMailu
    },
    {
      path: '/prihlaseni',
      name: 'Login',
      component: Prihlaseni
    },
    {
      path: '/registrace',
      name: 'Registration',
      component: Registrace
    },
    {
      path: '/mateDotaz',
      name: 'faq',
      component: FaqPage
    },
    {
      path: '/mate-dotaz',
      redirect: '/mateDotaz'
    },
    {
      path: '/faq',
      redirect: '/mateDotaz'
    },
    {
      path: '/poptavka',
      name: 'inquiry',
      component: PoptavkaPage
    },
    {
      path: '/category/:categoryId',
      name: 'category',
      component: CategoryPage,
      props: true
    },
    {
      path: '/category/:categoryId/subcategory/:subcategoryId',
      name: 'subcategory',
      component: CategoryPage,
      props: true
    }
  ]
})

// Store initialization - add before exporting the router
let initialized = false

router.beforeEach(async (to, from, next) => {
  // Only initialize once
  if (!initialized) {
    console.log('Initializing stores...')

    try {
      // Initialize user store - call init() only if it exists
      const userStore = useUserStore()
      if (typeof userStore.init === 'function') {
        userStore.init()
        console.log('User store initialized')
      } else {
        // Just access the store to initialize it
        console.log('User store accessed:', userStore.isLoggedIn ? 'Logged in' : 'Not logged in')
      }

      // Initialize cart store
      const cartStore = useCartStore()
      if (typeof cartStore.initCart === 'function') {
        await cartStore.initCart()
        console.log('Cart store initialized')
      } else {
        console.log('Cart store accessed, but initCart method not found')
      }

      initialized = true
      console.log('Stores initialized successfully')
    } catch (error) {
      console.error('Error initializing stores:', error)
    }
  }

  next()
})

export default router
