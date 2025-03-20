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
          <img
            :src="subcategory.image"
            :alt="subcategory.name"
            @error="handleImageError"
            data-placeholder="/images/placeholder.jpg"
          />
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

          <!-- Filtr výrobce -->
          <div class="filter-group">
            <div class="filter-header" @click="toggleFilter('manufacturer')">
              <h4>Výrobce</h4>
              <span class="toggle-icon">{{ filters.manufacturer.isOpen ? '−' : '+' }}</span>
            </div>
            <div class="filter-content" v-if="filters.manufacturer.isOpen">
              <div
                v-for="manufacturer in filters.manufacturer.options"
                :key="manufacturer.id"
                class="filter-option"
              >
                <label :for="'manufacturer-' + manufacturer.id">
                  <input
                    type="checkbox"
                    :id="'manufacturer-' + manufacturer.id"
                    v-model="manufacturer.selected"
                    @change="applyFilters"
                  />
                  <span class="option-name">{{ manufacturer.name }}</span>
                  <span class="option-count">({{ manufacturer.count }})</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Filtr dostupnosti -->
          <div class="filter-group">
            <div class="filter-header" @click="toggleFilter('availability')">
              <h4>Dostupnost</h4>
              <span class="toggle-icon">{{ filters.availability.isOpen ? '−' : '+' }}</span>
            </div>
            <div class="filter-content" v-if="filters.availability.isOpen">
              <div class="filter-option">
                <label for="availability-in-stock">
                  <input
                    type="checkbox"
                    id="availability-in-stock"
                    v-model="filters.availability.inStock"
                    @change="applyFilters"
                  />
                  <span class="option-name">Skladem</span>
                </label>
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
                <img :src="product.image || '/placeholder-image.jpg'" :alt="product.name" />
              </div>
              <div class="product-details">
                <h3 class="product-name">{{ product.name }}</h3>
                <div class="product-manufacturer">{{ product.manufacturer }}</div>
                <div class="product-dimension" v-if="product.dimension">
                  {{ product.dimension }}
                </div>
                <div class="product-price">
                  <div class="current-price">{{ formatPrice(product.price) }}</div>
                </div>
                <div class="product-availability" :class="getAvailabilityClass(product)">
                  {{ getAvailabilityText(product) }}
                </div>
              </div>
              <div class="product-actions">
                <button @click.stop="addToCart(product)" class="add-to-cart-btn">
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
import categoriesJson from '@/data/categories.json'

export default {
  name: 'CategoryPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const cart = useCart() // Import košíku
    const showNotification = ref(false) // Stav notifikace

    // Stav
    const categoryId = ref(null)
    const categoryData = ref({ name: '', subcategories: [] })
    const selectedSubcategory = ref(null)
    const allProducts = ref([])
    const filteredProducts = ref([])
    const isLoading = ref(true)
    const currentPage = ref(1)
    const itemsPerPage = 12
    const showSidebar = ref(false)
    const showPriceFilter = ref(true) // Možnost skrýt filtr ceny, pokud není relevantní
    const sortOption = ref('name-asc')

    // Filtry
    const filters = ref({
      price: {
        isOpen: true,
        min: null,
        max: null
      },
      manufacturer: {
        isOpen: true,
        options: []
      },
      availability: {
        isOpen: true,
        inStock: false
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

    // Updated handleImageError function to prevent infinite loops
    const handleImageError = (event) => {
      // Check if this is already the placeholder to prevent loops
      const currentSrc = event.target.src
      const placeholderPath = '/images/placeholder.jpg'

      // If the current source is already the placeholder or contains "placeholder",
      // don't try to replace it again
      if (currentSrc.includes('placeholder')) {
        // Just stop trying to load images for this element
        console.warn('Placeholder also failed to load')
        return
      }

      // Set a flag on the element to indicate we've handled the error
      event.target.setAttribute('data-error-handled', 'true')

      // Replace with placeholder
      event.target.src = placeholderPath

      // Log for debugging
      console.log(`Image failed to load: ${currentSrc}, replaced with placeholder`)
    }

    // Simulace načtení dat kategorie
    const loadCategoryData = async () => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Find the current category in our JSON data
      const category = categoriesJson.categories.find((cat) => cat.id === categoryId.value)

      // Set category data from the JSON file or use default if not found
      categoryData.value = category || {
        name: 'Kategorie nenalezena',
        subcategories: []
      }

      console.log('Loaded category data:', categoryData.value)
    }

    // Simulace načtení produktů
    const loadProducts = async () => {
      isLoading.value = true

      // Toto by bylo nahrazeno API voláním
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Vytvoření náhodných produktů pro ukázku
      const dummyProducts = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Produkt ${i + 1}`,
        manufacturer: ['DEK', 'Velux', 'Wienerberger', 'Porotherm', 'Ytong'][
          Math.floor(Math.random() * 5)
        ],
        dimension: ['10x20x30 cm', '20x30x40 cm', '15x25x35 cm', '5x15x25 cm'][
          Math.floor(Math.random() * 4)
        ],
        price: Math.floor(Math.random() * 10000) + 500,
        discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : 0,
        image: null, // URL obrázku by zde bylo
        availability: Math.floor(Math.random() * 4), // 0-skladem, 1-málo kusů, 2-na objednání, 3-nedostupné
        subcategoryId:
          categoryData.value.subcategories[
            Math.floor(Math.random() * categoryData.value.subcategories.length)
          ]?.id
      }))

      // Přidání vypočítaných hodnot
      dummyProducts.forEach((product) => {
        if (product.discount) {
          product.originalPrice = product.price
          product.price = Math.round((product.price * (100 - product.discount)) / 100)
        }
      })

      allProducts.value = dummyProducts

      // Naplnění filtrů
      populateFilters()

      isLoading.value = false

      // Počáteční filtrace
      filterProducts()
    }

    // Naplnění filtrů z produktů
    const populateFilters = () => {
      // Výrobci
      const manufacturers = {}
      allProducts.value.forEach((product) => {
        if (!manufacturers[product.manufacturer]) {
          manufacturers[product.manufacturer] = 0
        }
        manufacturers[product.manufacturer]++
      })

      filters.value.manufacturer.options = Object.keys(manufacturers).map((name) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        count: manufacturers[name],
        selected: false
      }))
    }

    // Filtrace produktů
    const filterProducts = () => {
      let result = [...allProducts.value]

      // Filtrování podle podkategorie
      if (selectedSubcategory.value) {
        result = result.filter((product) => product.subcategoryId === selectedSubcategory.value)
      }

      // Filtrování podle ceny
      if (filters.value.price.min) {
        result = result.filter((product) => product.price >= filters.value.price.min)
      }

      if (filters.value.price.max) {
        result = result.filter((product) => product.price <= filters.value.price.max)
      }

      // Filtrování podle výrobce
      const selectedManufacturers = filters.value.manufacturer.options
        .filter((m) => m.selected)
        .map((m) => m.name)

      if (selectedManufacturers.length > 0) {
        result = result.filter((product) => selectedManufacturers.includes(product.manufacturer))
      }

      // Filtrování podle dostupnosti (skladem)
      if (filters.value.availability.inStock) {
        result = result.filter(
          (product) => product.availability === 0 || product.availability === 1
        )
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
        case 'newest':
          // Pro ukázku - normálně by bylo řazení podle data
          products.sort((a, b) => b.id - a.id)
          break
      }
    }

    // Reset filtrů
    const resetFilters = () => {
      filters.value.price.min = null
      filters.value.price.max = null

      filters.value.manufacturer.options.forEach((option) => {
        option.selected = false
      })

      filters.value.availability.inStock = false

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
      return price.toLocaleString('cs-CZ') + ' Kč'
    }

    const getAvailabilityText = (product) => {
      switch (product.availability) {
        case 0:
          return 'Skladem'
        case 1:
          return 'Posledních pár kusů'
        case 2:
          return 'Na objednání'
        case 3:
          return 'Nedostupné'
        default:
          return 'Skladem'
      }
    }

    const getAvailabilityClass = (product) => {
      switch (product.availability) {
        case 0:
          return 'in-stock'
        case 1:
          return 'low-stock'
        case 2:
          return 'on-order'
        case 3:
          return 'unavailable'
        default:
          return 'in-stock'
      }
    }

    // Navigace na detail produktu
    const viewProductDetail = (productId) => {
      router.push(`/produkt/${productId}`)
    }

    // Přidání do košíku
    const addToCart = (product) => {
      // Formátujeme product pro košík, pokud je třeba
      const cartProduct = {
        id: product.id,
        name: product.name,
        price: product.price.toString(),
        image: product.image || '/images/placeholder.jpg',
        priceUnit: 'kus' // nebo jiná jednotka, pokud je k dispozici
      }

      // Přidáme produkt do košíku
      cart.addToCart(cartProduct)

      // Zobrazíme notifikaci
      showNotification.value = true

      // Po 3 sekundách notifikaci schováme
      setTimeout(() => {
        showNotification.value = false
      }, 3000)
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
      getAvailabilityText,
      getAvailabilityClass,
      resetFilters,
      applyFilters,
      applyPriceFilter,
      toggleFilter,
      sortProducts,
      viewProductDetail,
      selectSubcategory,
      addToCart,
      showNotification,
      handleImageError
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
  width: 50px;
  height: 50px;
  min-width: 50px;
  flex: 0 0 50px; /* Don't grow, don't shrink, stay at 50px */
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

.product-manufacturer {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
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

.product-availability {
  font-size: 13px;
  margin-bottom: 15px;
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

.unavailable {
  color: #e53935;
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
