//router with all imported views
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
import PotvrzeniObjednavky from '@/views/potvrzeniObjednavky.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
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
      path: '/potvrzeni-objednavky',
      name: 'orderConfirmation',
      component: PotvrzeniObjednavky
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

export default router
