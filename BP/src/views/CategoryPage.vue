<template>
  <div class="subcategory-tiles-container">
    <div class="subcategory-tiles">
      <div
        v-for="subcategory in categoryData.subcategories"
        :key="subcategory.id"
        class="subcategory-tile"
        :class="{ active: selectedSubcategory === subcategory.id }"
        @click="selectSubcategory(subcategory.id)"
      >
        <div class="subcategory-image">
          <img :src="subcategory.image || '/placeholder.png'" :alt="subcategory.name" />
        </div>
        <div class="subcategory-content">
          {{ subcategory.name }}
        </div>
      </div>
    </div>
  </div>

  <div class="category-container">
    <!-- Drobečková navigace -->
    <div class="breadcrumbs">
      <router-link to="/" class="breadcrumb-item">Domů</router-link>
      <span class="separator">›</span>
      <span class="breadcrumb-item active">{{ categoryData.name }}</span>
    </div>

    <!-- Hlavní obsah -->
    <div class="category-content">
      <!-- Levý panel s filtry a podkategoriemi -->
      <div class="sidebar" :class="{ 'sidebar-open': showSidebar }">
        <div class="sidebar-header mobile-only">
          <h3>Filtry a kategorie</h3>
          <button @click="showSidebar = false" class="close-sidebar">×</button>
        </div>

        <!-- Filtry -->
        <div class="sidebar-section">
          <h3>Filtry</h3>

          <!-- Filtr ceny -->
          <div class="filter-group">
            <div class="filter-header" @click="toggleFilter('price')">
              <h4>Cena</h4>
              <span class="toggle-icon">{{ filters.price.isOpen ? '−' : '+' }}</span>
            </div>
            <div class="filter-content" v-if="filters.price.isOpen">
              <div class="price-range">
                <div class="range-inputs">
                  <input
                    type="number"
                    v-model="filters.price.min"
                    placeholder="Od"
                    class="price-input"
                  />
                  <span class="range-separator">-</span>
                  <input
                    type="number"
                    v-model="filters.price.max"
                    placeholder="Do"
                    class="price-input"
                  />
                  <span class="currency">Kč</span>
                </div>
                <button @click="applyPriceFilter" class="apply-filter">Použít</button>
              </div>
            </div>
          </div>

          <!-- Tlačítko pro reset filtrů -->
          <div class="filter-actions">
            <button @click="resetFilters" class="reset-filters">Zrušit filtry</button>
          </div>
        </div>
      </div>

      <!-- Pravý panel s produkty -->
      <div class="product-section">
        <!-- Mobilní tlačítko pro zobrazení filtrů -->
        <button class="show-filters-btn mobile-only" @click="showSidebar = true">
          <span class="filter-icon">🔍</span> Filtry a kategorie
        </button>

        <!-- Horní lišta se sortem a počtem produktů -->
        <div class="product-toolbar">
          <div class="product-count">
            Zobrazeno {{ filteredProducts.length }} z {{ allProducts.length }} produktů
          </div>
          <div class="sort-options">
            <label for="sort-select">Seřadit dle:</label>
            <select
              id="sort-select"
              v-model="sortOption"
              @change="sortProducts"
              class="sort-select"
            >
              <option value="name-asc">Název (A-Z)</option>
              <option value="name-desc">Název (Z-A)</option>
              <option value="price-asc">Cena (nejnižší)</option>
              <option value="price-desc">Cena (nejvyšší)</option>
              <option value="newest">Nejnovější</option>
            </select>
          </div>
        </div>

        <!-- Seznam produktů -->
        <div class="product-grid">
          <div v-if="isLoading" class="loading-products">
            <div class="loading-spinner"></div>
            <p>Načítání produktů...</p>
          </div>

          <div v-else-if="filteredProducts.length === 0" class="no-products">
            <p>Pro zvolené filtry nebyly nalezeny žádné produkty.</p>
            <button @click="resetFilters" class="reset-filters">Zrušit filtry</button>
          </div>

          <div v-else class="product-items">
            <div
              v-for="product in paginatedProducts"
              :key="product.id"
              class="product-card"
              @click="viewProductDetail(product.id)"
            >
              <div class="product-image">
                <img :src="product.image || '/placeholder.png'" :alt="product.name" />
              </div>
              <div class="product-details">
                <h3 class="product-name">{{ product.name }}</h3>
                <div class="product-price">
                  <div class="current-price">
                    {{ formatPrice(product.price) }} / {{ product.price_unit }}
                  </div>
                </div>
              </div>
              <div class="product-actions">
                <!-- Button for authenticated users -->
                <button
                  v-if="userStore.isAuthenticated"
                  @click.stop="addToCart(product)"
                  class="add-to-cart-btn"
                >
                  <svg
                    class="cart-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path
                      d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                    ></path>
                  </svg>
                  <span>Přidat do košíku</span>
                </button>

                <!-- Login message for non-authenticated users -->
                <div v-else class="login-required-message">
                  <!-- Added @click.stop to prevent product navigation -->
                  <router-link @click.stop to="/prihlaseni" class="login-link">
                    Pro objednání se přihlaste
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- Stránkování -->
          <div v-if="totalPages > 1" class="pagination">
            <button class="pagination-btn" :disabled="currentPage === 1" @click="currentPage--">
              &laquo; Předchozí
            </button>

            <div class="pagination-pages">
              <span>Stránka {{ currentPage }} z {{ totalPages }}</span>
            </div>

            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              Další &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Notifikace o přidání do košíku -->
  <div class="cart-notification" v-if="showNotification">
    <div class="notification-content">
      <svg
        class="success-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>Produkt byl přidán do košíku</span>
    </div>
    <router-link to="/cart" class="view-cart-btn">Přejít do košíku</router-link>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCart } from '@/stores/stavKosiku'
import { useUserStore } from '@/stores'

export default {
  name: 'CategoryPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const cart = useCart() // Import košíku
    const userStore = useUserStore()
    const showNotification = ref(false) // Stav notifikace

    // Stav
    const categoryId = ref(null)
    const categoryData = ref({ name: '', subcategories: [] })
    const selectedSubcategory = ref(null)
    const allProducts = ref([])
    const filteredProducts = ref([])
    const isLoading = ref(true)
    const currentPage = ref(1)
    const itemsPerPage = 15
    const showSidebar = ref(false)
    const showPriceFilter = ref(true) // Možnost skrýt filtr ceny, pokud není relevantní
    const sortOption = ref('name-asc')

    // Filtry
    const filters = ref({
      price: {
        isOpen: true,
        min: null,
        max: null
      }
    })

    // Načtení kategorie z URL parametru
    onMounted(async () => {
      categoryId.value = route.params.id
      selectedSubcategory.value = route.query.subcategory

      // Načtení dat kategorie - simulace API volání
      await loadCategoryData()

      // Načtení produktů - simulace API volání
      await loadProducts()

      // Počáteční filtrace
      filterProducts()
    })

    // Sledování změny kategorie nebo podkategorie
    watch(
      () => route.params.id,
      async (newId) => {
        if (newId !== categoryId.value) {
          categoryId.value = newId
          isLoading.value = true
          currentPage.value = 1
          await loadCategoryData()
          await loadProducts()
          filterProducts()
        }
      }
    )

    watch(
      () => route.query.subcategory,
      (newSubcategory) => {
        selectedSubcategory.value = newSubcategory
        filterProducts()
        currentPage.value = 1
      }
    )

    // Simulace načtení dat kategorie
    // Update your loadCategoryData function to include images for subcategories
    const loadCategoryData = async () => {
      // Toto by bylo nahrazeno API voláním
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Simulace dat kategorie s obrázky
      const categories = {
        'hruba-stavba-a-zelezo': {
          name: 'Hrubá stavba a železo',
          subcategories: [
            {
              id: 'ztracene-bedneni',
              name: 'Ztracené bednění',
              count: 5,
              image: '/images/subcategories/ztracene-bedneni.jpeg'
            },
            {
              id: 'lepenky',
              name: 'Lepenky',
              count: 5,
              image: '/images/subcategories/lepenky.jpeg'
            },
            {
              id: 'odvodneni-a-zlaby',
              name: 'Odvodnění a žlaby',
              count: 5,
              image: '/images/subcategories/odvodneni-a-zlaby.jpeg'
            },
            {
              id: 'roxory',
              name: 'Roxory',
              count: 5,
              image: '/images/subcategories/roxory.jpeg'
            },
            {
              id: 'kari-site',
              name: 'Kari sítě',
              count: 5,
              image: '/images/subcategories/kari-site.jpeg'
            },
            {
              id: 'ploche-tyce',
              name: 'Ploché tyče',
              count: 5,
              image: '/images/subcategories/ploche-tyce.jpeg'
            },
            {
              id: 'l-uhelniky',
              name: 'L-úhelníky',
              count: 5,
              image: '/images/subcategories/l-uhelniky.jpeg'
            },
            {
              id: 'jakly',
              name: 'Jakly',
              count: 5,
              image: '/images/subcategories/jakly.jpeg'
            },
            {
              id: 'profily-zelezo',
              name: 'Profily',
              count: 5,
              image: '/images/subcategories/profily-zelezo.jpeg'
            },
            {
              id: 'zarubne',
              name: 'Zárubně',
              count: 5,
              image: '/images/subcategories/zarubne.jpeg'
            }
          ]
        },
        fasada: {
          name: 'Fasáda',
          subcategories: [
            {
              id: 'fasadni-omitky',
              name: 'Fasádní omítky',
              count: 5,
              image: '/images/subcategories/fasadni-omitky.jpeg'
            },
            {
              id: 'natery',
              name: 'Nátěry',
              count: 5,
              image: '/images/subcategories/natery.jpeg'
            },
            {
              id: 'patni-listy',
              name: 'Patní lišty',
              count: 5,
              image: '/images/subcategories/patni-listy.jpeg'
            },
            {
              id: 'polystyreny',
              name: 'Polystyreny',
              count: 5,
              image: '/images/subcategories/polystyreny.jpeg'
            },
            {
              id: 'mineralni-vaty',
              name: 'Minerální vaty',
              count: 5,
              image: '/images/subcategories/mineralni-vaty.jpeg'
            },
            {
              id: 'perlinka',
              name: 'Perlinka',
              count: 5,
              image: '/images/subcategories/perlinka.jpeg'
            },
            {
              id: 'extrudovany-polystyren',
              name: 'Extrudovaný polystyren',
              count: 5,
              image: '/images/subcategories/extrudovany-polystyren.jpeg'
            }
          ]
        },
        'drevo-a-strecha': {
          name: 'Dřevo a střecha',
          subcategories: [
            {
              id: 'prkna',
              name: 'Prkna',
              count: 5,
              image: '/images/subcategories/prkna.jpeg'
            },
            {
              id: 'osb-desky',
              name: 'OSB desky',
              count: 5,
              image: '/images/subcategories/osb-desky.jpeg'
            },
            {
              id: 'late',
              name: 'Latě',
              count: 5,
              image: '/images/subcategories/late.jpeg'
            },
            {
              id: 'hranoly',
              name: 'Hranoly',
              count: 5,
              image: '/images/subcategories/hranoly.jpeg'
            },
            {
              id: 'fosny',
              name: 'Fošny',
              count: 5,
              image: '/images/subcategories/fosny.jpeg'
            },
            {
              id: 'kvh',
              name: 'KVH',
              count: 5,
              image: '/images/subcategories/kvh.jpeg'
            },
            {
              id: 'tasky',
              name: 'Tašky',
              count: 5,
              image: '/images/subcategories/tasky.jpeg'
            },
            {
              id: 'sindel',
              name: 'Šindel',
              count: 5,
              image: '/images/subcategories/sindel.jpeg'
            },
            {
              id: 'doplnky',
              name: 'Doplňky',
              count: 5,
              image: '/images/subcategories/doplnky.jpeg'
            }
          ]
        },
        'sypke-smesi': {
          name: 'Sypké směsi',
          subcategories: [
            {
              id: 'malty',
              name: 'Malty',
              count: 5,
              image: '/images/subcategories/malty.jpeg'
            },
            {
              id: 'betony',
              name: 'Betony',
              count: 5,
              image: '/images/subcategories/betony.jpeg'
            },
            {
              id: 'lepidla',
              name: 'Lepidla',
              count: 5,
              image: '/images/subcategories/lepidla.jpeg'
            },
            {
              id: 'nivelacni-hmota',
              name: 'Nivelační hmota',
              count: 5,
              image: '/images/subcategories/nivelacni-hmota.jpeg'
            },
            {
              id: 'sadra',
              name: 'Sádra',
              count: 5,
              image: '/images/subcategories/sadra.jpeg'
            },
            {
              id: 'stuky',
              name: 'Štuky',
              count: 5,
              image: '/images/subcategories/stuky.jpeg'
            },
            {
              id: 'vapno',
              name: 'Vápno',
              count: 5,
              image: '/images/subcategories/vapno.jpeg'
            },
            {
              id: 'cement',
              name: 'Cement',
              count: 5,
              image: '/images/subcategories/cement.jpeg'
            },
            {
              id: 'multibat',
              name: 'Multibat',
              count: 5,
              image: '/images/subcategories/multibat.jpeg'
            }
          ]
        },
        'betonove-vyrobky': {
          name: 'Betonové výrobky',
          subcategories: [
            {
              id: 'dlazba-venkovni',
              name: 'Dlažba venkovní',
              count: 5,
              image: '/images/subcategories/dlazba-venkovni.jpeg'
            },
            {
              id: 'ploty',
              name: 'Ploty',
              count: 5,
              image: '/images/subcategories/ploty.jpeg'
            },
            {
              id: 'prvky-zahradni-architektury',
              name: 'Prvky zahr. architektury',
              count: 5,
              image: '/images/subcategories/prvky-zahradni-architektury.jpeg'
            },
            {
              id: 'obrubniky',
              name: 'Obrubníky',
              count: 5,
              image: '/images/subcategories/obrubniky.jpeg'
            }
          ]
        },
        'zdici-materialy': {
          name: 'Zdící materiály',
          subcategories: [
            {
              id: 'porobetonove-zdici-materialy',
              name: 'Porobetonové zdící mat.',
              count: 5,
              image: '/images/subcategories/porobetonove-zdici-materialy.jpeg'
            },
            {
              id: 'keramicke-zdici-materialy',
              name: 'Keramické zdící mat.',
              count: 5,
              image: '/images/subcategories/keramicke-zdici-materialy.jpeg'
            },
            {
              id: 'betonove-zdici-materialy',
              name: 'Betonové zdící mat.',
              count: 5,
              image: '/images/subcategories/betonove-zdici-materialy.jpeg'
            },
            {
              id: 'plne-cihly',
              name: 'Plné cihly',
              count: 5,
              image: '/images/subcategories/plne-cihly.jpeg'
            }
          ]
        },
        'chemie-a-barvy': {
          name: 'Chemie a barvy',
          subcategories: [
            {
              id: 'silikony-neutral',
              name: 'Silikony neutral',
              count: 5,
              image: '/images/subcategories/silikony-neutral.jpeg'
            },
            {
              id: 'silikony-sanitarni',
              name: 'Silikony sanitární',
              count: 5,
              image: '/images/subcategories/silikony-sanitarni.jpeg'
            },
            {
              id: 'sparovaci-hmoty',
              name: 'Spárovací hmoty',
              count: 5,
              image: '/images/subcategories/sparovaci-hmoty.jpeg'
            },
            {
              id: 'peny',
              name: 'Pěny',
              count: 5,
              image: '/images/subcategories/peny.jpeg'
            },
            {
              id: 'tmely',
              name: 'Tmely',
              count: 5,
              image: '/images/subcategories/tmely.jpeg'
            },
            {
              id: 'lepidla-chemie',
              name: 'Lepidla',
              count: 5,
              image: '/images/subcategories/lepidla-chemie.jpeg'
            },
            {
              id: 'cistice',
              name: 'Čističe',
              count: 5,
              image: '/images/subcategories/cistice.jpeg'
            },
            {
              id: 'vnitrni-natery',
              name: 'Vnitřní nátěry',
              count: 5,
              image: '/images/subcategories/vnitrni-natery.jpeg'
            },
            {
              id: 'barvy-na-drevo',
              name: 'Barvy na dřevo',
              count: 5,
              image: '/images/subcategories/barvy-na-drevo.jpeg'
            },
            {
              id: 'barvy-na-kov',
              name: 'Barvy na kov',
              count: 5,
              image: '/images/subcategories/barvy-na-kov.jpeg'
            },
            {
              id: 'barvy-na-podlahu',
              name: 'Barvy na podlahu',
              count: 5,
              image: '/images/subcategories/barvy-na-podlahu.jpeg'
            },
            {
              id: 'laky',
              name: 'Laky',
              count: 5,
              image: '/images/subcategories/laky.jpeg'
            },
            {
              id: 'spreje',
              name: 'Spreje',
              count: 5,
              image: '/images/subcategories/spreje.jpeg'
            }
          ]
        },
        'spojovaci-material': {
          name: 'Spojovací materiál',
          subcategories: [
            {
              id: 'vruty',
              name: 'Vruty',
              count: 5,
              image: '/images/subcategories/vruty.jpeg'
            },
            {
              id: 'srouby',
              name: 'Šrouby',
              count: 5,
              image: '/images/subcategories/srouby.jpeg'
            },
            {
              id: 'kotvici-patky',
              name: 'Kotvící patky',
              count: 5,
              image: '/images/subcategories/kotvici-patky.jpeg'
            },
            {
              id: 'uhelniky',
              name: 'Úhelníky',
              count: 5,
              image: '/images/subcategories/uhelniky.jpeg'
            },
            {
              id: 'zavitove-tyce',
              name: 'Závitové tyče',
              count: 5,
              image: '/images/subcategories/zavitove-tyce.jpeg'
            },
            {
              id: 'hrebiky',
              name: 'Hřebíky',
              count: 5,
              image: '/images/subcategories/hrebiky.jpeg'
            },
            {
              id: 'matky-a-podlozky',
              name: 'Matky a Podložky',
              count: 5,
              image: '/images/subcategories/matky-a-podlozky.jpeg'
            }
          ]
        },
        'elektro-a-naradi': {
          name: 'Elektro a nářadí',
          subcategories: [
            {
              id: 'kabely',
              name: 'Kabely',
              count: 5,
              image: '/images/subcategories/kabely.jpeg'
            },
            {
              id: 'spinace-zasuvky',
              name: 'Spínače, zásuvky',
              count: 5,
              image: '/images/subcategories/spinace-zasuvky.jpeg'
            },
            {
              id: 'halogeny-a-zarovky',
              name: 'Halogeny a žárovky',
              count: 5,
              image: '/images/subcategories/halogeny.jpeg'
            },
            {
              id: 'krabice',
              name: 'Krabice',
              count: 5,
              image: '/images/subcategories/krabice.jpeg'
            },
            {
              id: 'elektro-naradi',
              name: 'Elektro nářadí',
              count: 5,
              image: '/images/subcategories/elektro-naradi.jpeg'
            },
            {
              id: 'aku-naradi',
              name: 'Aku nářadí',
              count: 5,
              image: '/images/subcategories/aku-naradi.jpeg'
            },
            {
              id: 'rucni-naradi',
              name: 'Ruční nářadí',
              count: 5,
              image: '/images/subcategories/rucni-naradi.jpeg'
            },
            {
              id: 'doplnky',
              name: 'Doplňky',
              count: 5,
              image: '/images/subcategories/doplnky-naradi.jpeg'
            },
            {
              id: 'kotouce-a-vrtaky',
              name: 'Kotouče a vrtáky',
              count: 5,
              image: '/images/subcategories/kotouce-a-vrtaky.jpeg'
            }
          ]
        },
        sadrokarton: {
          name: 'Sádrokarton',
          subcategories: [
            {
              id: 'sadrokarton',
              name: 'Sádrokarton',
              count: 5,
              image: '/images/subcategories/sadrokarton.jpeg'
            },
            {
              id: 'vruty-sadrokarton',
              name: 'Vruty',
              count: 5,
              image: '/images/subcategories/vruty-sadrokarton.jpeg'
            },
            {
              id: 'pasky',
              name: 'Pásky',
              count: 5,
              image: '/images/subcategories/pasky.jpeg'
            },
            {
              id: 'tesneni',
              name: 'Těsnění',
              count: 5,
              image: '/images/subcategories/tesneni.jpeg'
            },
            {
              id: 'profily',
              name: 'Profily',
              count: 5,
              image: '/images/subcategories/profily.jpeg'
            }
          ]
        },
        ostatni: {
          name: 'Ostatní',
          subcategories: [
            {
              id: 'obleceni-a-ochranne-pomucky',
              name: 'Oblečení a ochranné pomůcky',
              count: 5,
              image: '/images/subcategories/obleceni-a-ochranne-pomucky.jpeg'
            },
            {
              id: 'textilie-a-obalove-materialy',
              name: 'Textilie a obalové materiály',
              count: 5,
              image: '/images/subcategories/textilie-a-obalove-materialy.jpeg'
            },
            {
              id: 'auto-moto',
              name: 'Auto-moto',
              count: 5,
              image: '/images/subcategories/auto-moto.jpeg'
            },
            {
              id: 'obkladyy',
              name: 'Obklady',
              count: 5,
              image: '/images/subcategories/obklady.jpeg'
            }
          ]
        }
      }

      categoryData.value = categories[categoryId.value] || {
        name: 'Kategorie nenalezena',
        subcategories: []
      }
    }

    const loadProducts = async () => {
      isLoading.value = true

      try {
        // Build API URL with query parameters
        let apiUrl = `/api/products?limit=${itemsPerPage * 100}`

        // Add category filter if we have a categoryId
        if (categoryId.value) {
          apiUrl += `&category=${categoryId.value}`
        }

        // Add subcategory filter if selected directly in the API call
        if (selectedSubcategory.value) {
          apiUrl += `&subcategory=${selectedSubcategory.value}`
        }

        console.log('Fetching products from:', apiUrl)

        const response = await fetch(apiUrl)
        if (!response.ok) throw new Error(`API error: ${response.status}`)

        const result = await response.json()
        console.log('API response:', result)

        // Transform API response to match your expected format
        const products = result.data.products.map((product) => ({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price) || 0,
          image: product.image_url
            ? `https://api.stavebninylysa.cz${product.image_url}` // Just prepend the domain
            : 'https://api.stavebninylysa.cz/images/produkty/placeholder.png',
          price_unit: product.jednotka || 'ks',
          // Store the actual subcategory from the database
          subcategory: product.subcategory
        }))

        allProducts.value = products
      } catch (error) {
        console.error('Error loading products:', error)
        allProducts.value = []
      } finally {
        isLoading.value = false
        filterProducts()
      }
    }

    // Filtrace produktů
    const filterProducts = () => {
      let result = [...allProducts.value]

      // Filtrování podle podkategorie
      if (selectedSubcategory.value) {
        console.log(`Filtering for subcategory: ${selectedSubcategory.value}`)
        result = result.filter((product) => product.subcategory === selectedSubcategory.value)
        console.log(`Found ${result.length} products for subcategory: ${selectedSubcategory.value}`)
      }

      // Filtrování podle ceny
      if (filters.value.price.min) {
        result = result.filter((product) => product.price >= filters.value.price.min)
      }

      if (filters.value.price.max) {
        result = result.filter((product) => product.price <= filters.value.price.max)
      }

      // Řazení produktů
      sortProductsList(result)

      filteredProducts.value = result
      currentPage.value = 1
    }

    // Function to handle subcategory selection from tiles
    const selectSubcategory = (subcategoryId) => {
      router.push({
        path: route.path,
        query: {
          ...route.query,
          subcategory: subcategoryId
        }
      })
    }
    // Řazení produktů
    const sortProducts = () => {
      sortProductsList(filteredProducts.value)
    }

    const sortProductsList = (products) => {
      switch (sortOption.value) {
        case 'name-asc':
          products.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'name-desc':
          products.sort((a, b) => b.name.localeCompare(a.name))
          break
        case 'price-asc':
          products.sort((a, b) => a.price - b.price)
          break
        case 'price-desc':
          products.sort((a, b) => b.price - a.price)
          break
      }
    }

    // Reset filtrů
    const resetFilters = () => {
      filters.value.price.min = null
      filters.value.price.max = null

      filterProducts()
    }

    // Aplikace filtrů
    const applyFilters = () => {
      filterProducts()
    }

    // Aplikace cenového filtru
    const applyPriceFilter = () => {
      filterProducts()
    }

    // Přepínání sekcí filtrů
    const toggleFilter = (filterName) => {
      filters.value[filterName].isOpen = !filters.value[filterName].isOpen
    }

    // Vypočítané hodnoty
    const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage))

    const paginatedProducts = computed(() => {
      const startIndex = (currentPage.value - 1) * itemsPerPage
      return filteredProducts.value.slice(startIndex, startIndex + itemsPerPage)
    })

    // Pomocné funkce
    const formatPrice = (price) => {
      // Format to exactly 2 decimal places
      const formattedPrice = parseFloat(price).toFixed(2)
      // Replace dot with comma for Czech format
      return formattedPrice.replace('.', ',') + ' Kč'
    }

    // Navigace na detail produktu
    const viewProductDetail = (productId) => {
      //router.push(`/produkt/${productId}`)
    }

    // Přidání produktu do košíku
    const addToCart = async (product) => {
      // Check if user is authenticated
      if (!userStore.isAuthenticated) {
        // If not authenticated, don't do anything
        return
      }

      // Formátujeme product pro košík
      const cartProduct = {
        id: product.id,
        name: product.name,
        price: typeof product.price === 'number' ? product.price.toString() : product.price,
        image: product.image || '/placeholder.png',
        priceUnit: 'kus'
      }

      // Try to add to cart and show notification only on success
      const success = await cart.addToCart(cartProduct)

      if (success) {
        // Show notification
        showNotification.value = true

        // Hide notification after 3 seconds
        setTimeout(() => {
          showNotification.value = false
        }, 3000)
      }
    }
    return {
      categoryData,
      selectedSubcategory,
      allProducts,
      filteredProducts,
      paginatedProducts,
      isLoading,
      currentPage,
      totalPages,
      filters,
      showSidebar,
      showPriceFilter,
      sortOption,
      formatPrice,
      resetFilters,
      applyFilters,
      applyPriceFilter,
      toggleFilter,
      sortProducts,
      viewProductDetail,
      selectSubcategory,
      userStore,
      addToCart,
      showNotification
    }
  }
}
</script>

<style scoped>
.HeadingStrip {
  display: none;
}
.subcategory-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin: 30px 0;
}
.subcategory-tile.active {
  background-color: #f5852a;
  border-color: #e67722;
}
.subcategory-tile.active .subcategory-content {
  color: white;
  font-weight: 600;
}
.subcategory-tile.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #e67722;
}
.subcategory-tile.active:hover {
  background-color: #e67722; /* Darker orange for better contrast */
  border-color: #d86316;
  color: white;
}
.subcategory-tile:hover:not(.active) {
  background-color: #f5f5f5;
  border-color: #f5852a;
}
.subcategory-tile.active:hover .subcategory-content {
  color: white;
}
.subcategory-tile {
  position: relative;
}
.login-required-message {
  width: 100%;
  padding: 10px 0;
  background-color: #f0f0f0;
  border-radius: 4px;
  text-align: center;
}
.login-link {
  color: #f5852a;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.login-link:hover {
  color: #e67722;
  text-decoration: underline;
}
.subcategory-tile {
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: calc(25% - 15px);
  min-width: 200px;
  max-width: 280px;
  height: 60px; /* Fixed height */
  box-sizing: border-box; /* Important */
  overflow: hidden; /* Prevent content from expanding the box */
}

.subcategory-tile:hover {
  background-color: #f5f5f5;
  border-color: #f5852a;
}

.subcategory-content h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
}
.subcategory-tiles-container {
  max-width: 1200px;
  margin: 0 auto 30px;
  padding: 0 20px;
}

.subcategory-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: flex-start;
  margin: 20px 0;
}
.subcategory-content {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap; /* Prevent text wrapping */
  overflow: hidden;
  text-overflow: ellipsis; /* Add ellipsis for text that overflows */
}
.subcategory-image {
  width: 60px;
  height: 60px;
  min-width: 60px;
  flex: 0 0 60px; /* Don't grow, don't shrink, stay at 50px */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.subcategory-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.tile-product-count {
  font-size: 14px;
  color: #666;
}

.subcategory-tile:hover .tile-product-count {
  color: rgba(255, 255, 255, 0.8);
}

h1 {
  color: #0e0e0e;
  margin: 100px auto 80px auto;
  text-align: center;
  font-size: 42px;
}

.category-container {
  max-width: 1200px;
  margin: 0 auto 80px;
  padding: 0 20px;
  font-family: Arial, sans-serif;
}

/* Drobečková navigace */
.breadcrumbs {
  margin: 20px 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  font-size: 14px;
}

.breadcrumb-item {
  color: #555;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-item:hover {
  color: #f5852a;
}

.breadcrumb-item.active {
  color: #333;
  font-weight: 500;
}

.separator {
  margin: 0 10px;
  color: #ccc;
}

/* Hlavní obsah */
.category-content {
  display: flex;
  gap: 30px;
}

/* Levý panel s filtry */
.sidebar {
  flex: 0 0 260px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  padding: 20px;
  margin-bottom: 20px;
  align-self: flex-start;
  position: sticky;
  top: 20px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.close-sidebar {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
}

.sidebar-section {
  margin-bottom: 25px;
}

.sidebar-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

/* Podkategorie */
.subcategory-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.subcategory-list li {
  margin-bottom: 12px;
}

.subcategory-list a {
  display: flex;
  justify-content: space-between;
  color: #555;
  text-decoration: none;
  transition: color 0.2s;
  font-size: 15px;
}

.subcategory-list a:hover {
  color: #f5852a;
}

.subcategory-list a.active {
  color: #f5852a;
  font-weight: 600;
}

.product-count {
  color: #999;
  font-size: 13px;
}

/* Filtry */
.filter-group {
  margin-bottom: 15px;
  border-bottom: 1px solid #f5f5f5;
  padding-bottom: 10px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 5px 0;
}

.filter-header h4 {
  margin: 0;
  font-size: 15px;
  color: #333;
  font-weight: 600;
}

.toggle-icon {
  font-size: 20px;
  color: #f5852a;
}

.filter-content {
  padding: 10px 0;
}

.filter-option {
  margin-bottom: 10px;
}

.filter-option label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
}

.filter-option input[type='checkbox'] {
  margin-right: 10px;
}

.option-name {
  flex: 1;
}

.option-count {
  color: #999;
  font-size: 12px;
}

/* Cenový filtr */
.price-range {
  margin-top: 10px;
}

.range-inputs {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.price-input {
  width: 80px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.range-separator {
  margin: 0 10px;
  color: #888;
}

.currency {
  margin-left: 8px;
  color: #888;
}

.apply-filter {
  background-color: #f5852a;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.apply-filter:hover {
  background-color: #e67722;
}

.filter-actions {
  margin-top: 20px;
}

.reset-filters {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.reset-filters:hover {
  background-color: #e0e0e0;
}

/* Pravý panel s produkty */
.product-section {
  flex: 1;
}

.show-filters-btn {
  display: none;
  width: 100%;
  padding: 12px 15px;
  background-color: #f5852a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 20px;
  text-align: center;
}

.filter-icon {
  margin-right: 10px;
}

/* Lišta s počtem a řazením */
.product-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.product-count {
  font-size: 14px;
  color: #555;
}

.sort-options {
  display: flex;
  align-items: center;
}

.sort-options label {
  margin-right: 10px;
  font-size: 14px;
  color: #555;
}

.sort-select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

/* Seznam produktů */
.product-grid {
  margin-bottom: 30px;
}

.loading-products,
.no-products {
  padding: 40px;
  text-align: center;
  color: #666;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #f5852a;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.product-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.product-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.product-image {
  position: relative;
  height: 200px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #e53935;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 5px 8px;
  border-radius: 4px;
}

.product-details {
  padding: 15px;
}

.product-name {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-dimension {
  font-size: 13px;
  color: #888;
  margin-bottom: 10px;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.old-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.current-price {
  font-size: 18px;
  font-weight: 600;
  color: #e53935;
}

.in-stock {
  color: #4caf50;
}

.low-stock {
  color: #ff9800;
}

.on-order {
  color: #2196f3;
}

.product-actions {
  padding: 0 15px 15px;
}

.add-to-cart-btn {
  width: 100%;
  padding: 10px 0;
  background-color: #f5852a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.add-to-cart-btn:hover {
  background-color: #e67722;
}

.cart-icon {
  width: 16px;
  height: 16px;
  stroke: white;
}

/* Stránkování */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.pagination-btn {
  padding: 8px 15px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  font-size: 14px;
  color: #666;
}

/* Notifikace */
.cart-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 15px 20px;
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.success-icon {
  width: 20px;
  height: 20px;
  stroke: #4caf50;
}

.view-cart-btn {
  margin-left: 20px;
  color: #f5852a;
  text-decoration: none;
  font-weight: 500;
}

.view-cart-btn:hover {
  text-decoration: underline;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responzivní design */
@media (max-width: 950px) {
  .category-content {
    flex-direction: column;
  }

  .sidebar {
    flex: none;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: 1000;
    border-radius: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    overflow-y: auto;
  }
  .subcategory-tile {
    width: calc(33.33% - 15px);
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .show-filters-btn {
    display: block;
  }

  .mobile-only {
    display: block;
  }
}

@media (min-width: 951px) {
  .mobile-only {
    display: none !important;
  }
}

@media (max-width: 768px) {
  h1 {
    font-size: 32px;
    margin: 60px auto 40px auto;
  }
  .subcategory-tiles {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .product-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .sort-options {
    width: 100%;
    justify-content: space-between;
  }
  .subcategory-tile {
    width: calc(50% - 15px);
  }
  .sort-select {
    flex: 1;
  }

  .product-items {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .cart-notification {
    left: 20px;
    right: 20px;
    flex-direction: column;
    align-items: flex-start;
  }

  .view-cart-btn {
    margin-left: 0;
    margin-top: 10px;
    align-self: flex-end;
  }
}

@media (max-width: 576px) {
  h1 {
    font-size: 28px;
    margin: 40px auto 30px auto;
  }

  .subcategory-tiles {
    grid-template-columns: repeat(2, 1fr);
  }

  .product-items {
    grid-template-columns: 1fr;
  }
  .subcategory-tile {
    width: 100%;
  }
  .pagination {
    flex-direction: column;
    gap: 10px;
  }

  .pagination-btn {
    width: 100%;
  }

  .pagination-pages {
    order: -1;
  }
}
</style>
