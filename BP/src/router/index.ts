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
      component: HomePage,
      meta: {
        title: 'Stavebniny Lysá | Široký sortiment stavebního materiálu',
        description:
          'Stavebniny Lysá nad Labem – vše pro stavbu a rekonstrukci. Hrubá stavba, fasáda, dřevo, železo, barvy, elektro a odborné poradenství.'
      }
    },
    {
      path: '/search',
      name: 'SearchResults',
      component: SearchResults,
      meta: {
        title: 'Výsledky hledání | Stavebniny Lysá',
        description: 'Výsledky vyhledávání stavebních materiálů ve Stavebninách Lysá nad Labem.'
      }
    },
    {
      path: '/reset-password/:token',
      name: 'ResetHesla',
      component: ResetHesla,
      meta: {
        title: 'Obnova hesla | Stavebniny Lysá',
        description: 'Obnovte si heslo do svého účtu na Stavebninách Lysá nad Labem.'
      }
    },
    {
      path: '/upravit-profil',
      name: 'upravitProfil',
      component: UpravitProfil,
      meta: {
        title: 'Upravit profil | Stavebniny Lysá',
        description: 'Upravit osobní údaje v zákaznickém profilu.'
      }
    },
    {
      path: '/objednavky',
      name: 'objednavky',
      component: MojeObjednavky,
      meta: {
        title: 'Moje objednávky | Stavebniny Lysá',
        description: 'Přehled vašich objednávek ve Stavebninách Lysá nad Labem.'
      }
    },
    {
      path: '/zmena-hesla',
      name: 'zmenaHesla',
      component: ZmenaHesla,
      meta: {
        title: 'Změna hesla | Stavebniny Lysá',
        description: 'Změna hesla pro váš zákaznický účet.'
      }
    },
    {
      path: '/cart',
      name: 'cart',
      component: Kosik,
      meta: {
        title: 'Nákupní košík | Stavebniny Lysá',
        description: 'Obsah vašeho nákupního košíku ve Stavebninách Lysá.'
      }
    },
    {
      path: '/kategorie/:id',
      name: 'kategorie',
      component: CategoryPage,
      meta: {
        title: 'Kategorie produktů | Stavebniny Lysá',
        description: 'Procházejte produkty podle kategorií ve Stavebninách Lysá.'
      }
    },
    {
      path: '/o-nas',
      name: 'about',
      component: AboutView,
      meta: {
        title: 'O nás | Stavebniny Lysá nad Labem',
        description:
          'Stavebniny Lysá nad Labem působí na trhu od roku 2013. Specializovaný prodejce stavebních materiálů s osobním přístupem a odborným poradenstvím.'
      }
    },
    {
      path: '/potvrzeni-objednavky',
      name: 'orderConfirmation',
      component: PotvrzeniObjednavky,
      meta: {
        title: 'Potvrzení objednávky | Stavebniny Lysá',
        description: 'Vaše objednávka byla úspěšně dokončena.'
      }
    },
    {
      path: '/profil',
      name: 'profil',
      component: MujProfil,
      meta: {
        title: 'Můj profil | Stavebniny Lysá',
        description: 'Zákaznický profil – osobní údaje a nastavení.'
      }
    },
    {
      path: '/verify-email/:token',
      name: 'VerifyEmail',
      component: OvereniMailu,
      meta: {
        title: 'Ověření e-mailu | Stavebniny Lysá',
        description: 'Potvrzení vašeho e-mailu.'
      }
    },
    {
      path: '/prihlaseni',
      name: 'Login',
      component: Prihlaseni,
      meta: {
        title: 'Přihlášení | Stavebniny Lysá',
        description: 'Přihlaste se do svého zákaznického účtu ve Stavebninách Lysá.'
      }
    },
    {
      path: '/registrace',
      name: 'Registration',
      component: Registrace,
      meta: {
        title: 'Registrace | Stavebniny Lysá',
        description: 'Registrujte se a využijte výhod zákaznického účtu.'
      }
    },
    {
      path: '/mateDotaz',
      name: 'faq',
      component: FaqPage,
      meta: {
        title: 'Máte dotaz? | Stavebniny Lysá',
        description: 'Nejčastější dotazy zákazníků a odpovědi na ně.'
      }
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
      component: PoptavkaPage,
      meta: {
        title: 'Poptávka | Stavebniny Lysá',
        description: 'Odešlete poptávku na stavební materiály a my se vám ozveme.'
      }
    },
    {
      path: '/category/:categoryId',
      name: 'category',
      component: CategoryPage,
      props: true,
      meta: {
        title: 'Kategorie produktů | Stavebniny Lysá',
        description: 'Zobrazit produkty v kategorii stavebních materiálů.'
      }
    },
    {
      path: '/category/:categoryId/subcategory/:subcategoryId',
      name: 'subcategory',
      component: CategoryPage,
      props: true,
      meta: {
        title: 'Podkategorie produktů | Stavebniny Lysá',
        description: 'Zobrazit produkty v podkategorii stavebních materiálů.'
      }
    },
    // 404 catch-all
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound,
      meta: {
        title: 'Stránka nenalezena | Stavebniny Lysá',
        description: 'Tato stránka neexistuje nebo byla odstraněna.'
      }
    }
  ]
})

export default router
