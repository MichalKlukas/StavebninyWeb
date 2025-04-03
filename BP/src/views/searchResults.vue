<template>
  <div class="HeadingStrip">
    <h1>Výsledky vyhledávání</h1>
  </div>

  <div class="search-results-container">
    <!-- Drobečková navigace -->
    <div class="breadcrumbs">
      <router-link to="/" class="breadcrumb-item">Domů</router-link>
      <span class="separator">›</span>
      <span class="breadcrumb-item active">Výsledky vyhledávání: "{{ searchQuery }}"</span>
    </div>

    <!-- Hlavní obsah -->
    <div class="search-content">
      <!-- Levý panel s filtry -->
      <div class="sidebar" :class="{ 'sidebar-open': showSidebar }">
        <div class="sidebar-header mobile-only">
          <h3>Filtry</h3>
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
          <span class="filter-icon">🔍</span> Filtry
        </button>

        <!-- Search Summary -->
        <div class="search-summary">
          <h2 v-if="searchQuery">Výsledky pro: "{{ searchQuery }}"</h2>
        </div>

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
            <p>Pro vyhledávání "{{ searchQuery }}" nebyly nalezeny žádné produkty.</p>
            <div class="search-suggestions">
              <h3>Zkuste:</h3>
              <ul>
                <li>Zkontrolovat pravopis</li>
                <li>Použít jiná klíčová slova</li>
                <li>Použít obecnější výrazy</li>
              </ul>
            </div>
            <button @click="resetFilters" class="reset-filters" v-if="filtersApplied">
              Zrušit filtry
            </button>
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
                <div class="product-dimension" v-if="product.dimension">
                  {{ product.dimension }}
                </div>
                <div class="product-price">
                  <div class="current-price">{{ formatPrice(product.price) }}</div>
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
import axios from 'axios'

export default {
  name: 'SearchResults',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const cart = useCart() // Import košíku
    const showNotification = ref(false) // Stav notifikace

    // Stav
    const searchQuery = ref('')
    const allProducts = ref([])
    const filteredProducts = ref([])
    const isLoading = ref(true)
    const currentPage = ref(1)
    const itemsPerPage = 12
    const showSidebar = ref(false)
    const sortOption = ref('name-asc')

    // Filtry
    const filters = ref({
      price: {
        isOpen: true,
        min: null,
        max: null
      }
    })

    // Kontrola, zda jsou použity filtry
    const filtersApplied = computed(() => {
      return filters.value.price.min != null || filters.value.price.max != null
    })

    // Načtení hledaného výrazu z URL parametru
    onMounted(async () => {
      searchQuery.value = route.query.q || ''

      if (searchQuery.value) {
        // Načtení výsledků vyhledávání - API volání
        await fetchSearchResults()
      } else {
        isLoading.value = false
        allProducts.value = []
        filteredProducts.value = []
      }
    })

    // Sledování změny hledaného výrazu
    watch(
      () => route.query.q,
      async (newQuery) => {
        if (newQuery !== searchQuery.value) {
          searchQuery.value = newQuery || ''
          isLoading.value = true
          currentPage.value = 1
          resetFilters()

          if (searchQuery.value) {
            await fetchSearchResults()
          } else {
            isLoading.value = false
            allProducts.value = []
            filteredProducts.value = []
          }
        }
      }
    )

    // Načtení výsledků vyhledávání
    const fetchSearchResults = async () => {
      isLoading.value = true

      try {
        // API call to your search endpoint
        const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery.value)}`)

        // Process the actual API response
        if (response.data && response.data.products) {
          allProducts.value = response.data.products.map((product) => ({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price || 0),
            image: product.image_url
              ? `http://46.28.108.195/images/produkty/${product.image_url}`
              : '/placeholder.png',
            price_unit: product.price_unit || product.jednotka || 'ks',
            category: product.category || '',
            subcategory: product.subcategory || ''
          }))
        } else {
          allProducts.value = []
        }
      } catch (error) {
        console.error('Search error details:', {
          message: error.message,
          response: error.response
            ? {
                status: error.response.status,
                data: error.response.data
              }
            : 'No response',
          request: error.request ? 'Request was made but no response received' : 'No request'
        })
        allProducts.value = []
      }

      // apply initial filtering
      filterProducts()
      isLoading.value = false
    }

    // Filtrace produktů
    const filterProducts = () => {
      let result = [...allProducts.value]

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
      return price.toLocaleString('cs-CZ') + ' Kč'
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
        image: product.image || '/placeholder-image.jpg',
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
      searchQuery,
      allProducts,
      filteredProducts,
      paginatedProducts,
      isLoading,
      currentPage,
      totalPages,
      filters,
      showSidebar,
      sortOption,
      filtersApplied,
      formatPrice,
      resetFilters,
      applyFilters,
      applyPriceFilter,
      toggleFilter,
      sortProducts,
      viewProductDetail,
      addToCart,
      showNotification
    }
  }
}
</script>

<style scoped>
.HeadingStrip {
  width: 100%;
  height: 150px;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
}

h1 {
  color: #0e0e0e;
  margin: 100px auto 80px auto;
  text-align: center;
  font-size: 42px;
}

.search-results-container {
  max-width: 1200px;
  margin: 0 auto 80px;
  padding: 0 20px;
  font-family: Arial, sans-serif;
}

.search-summary {
  margin-bottom: 20px;
}

.search-summary h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
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
.search-content {
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

.search-suggestions {
  max-width: 500px;
  margin: 20px auto;
  text-align: left;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.search-suggestions h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.search-suggestions ul {
  list-style-type: disc;
  padding-left: 20px;
}

.search-suggestions li {
  margin-bottom: 8px;
  color: #555;
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
  .search-content {
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

  .HeadingStrip {
    height: 120px;
  }

  .product-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .sort-options {
    width: 100%;
    justify-content: space-between;
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

  .HeadingStrip {
    height: 100px;
  }

  .product-items {
    grid-template-columns: 1fr;
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
