<template>
  <div class="HeadingStrip">
    <h1>Moje objednávky</h1>
  </div>

  <div class="profile-container">
    <div class="profile-content">
      <!-- Použití komponenty bočního menu -->
      <ProfileSidebar active-section="objednavky" />

      <!-- Hlavní obsah - seznam objednávek -->
      <div class="orders-section">
        <h2>Historie objednávek</h2>

        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Načítání objednávek...</p>
        </div>

        <div v-else-if="error" class="error-container">
          <p>{{ error }}</p>
          <button @click="refreshOrders" class="refresh-button">Zkusit znovu</button>
        </div>

        <div v-else-if="orders.length === 0" class="no-orders">
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <h3>Zatím nemáte žádné objednávky</h3>
            <p>Po vytvoření objednávky zde uvidíte její stav a historii.</p>
            <router-link to="/kategorie/hruba-stavba" class="shop-button">
              Začít nakupovat
            </router-link>
          </div>
        </div>

        <div v-else class="orders-list">
          <!-- Filtr objednávek -->
          <div class="filters-row">
            <div class="search-filter">
              <input
                type="text"
                placeholder="Hledat podle čísla objednávky..."
                v-model="searchQuery"
                class="search-input"
              />
            </div>
            <div class="date-filter">
              <select v-model="periodFilter" class="filter-select">
                <option value="all">Všechny objednávky</option>
                <option value="month">Poslední měsíc</option>
                <option value="6months">Posledních 6 měsíců</option>
                <option value="year">Poslední rok</option>
              </select>
            </div>
          </div>

          <!-- Mobilní karty pro menší obrazovky -->
          <div class="orders-mobile">
            <div v-for="order in filteredOrders" :key="order.id" class="order-card">
              <div class="order-header">
                <div class="order-number">Objednávka č. {{ order.number }}</div>
              </div>
              <div class="order-info">
                <div class="order-row">
                  <div class="info-label">Datum:</div>
                  <div class="info-value">{{ formatDate(order.date) }}</div>
                </div>
                <div class="order-row">
                  <div class="info-label">Položky:</div>
                  <div class="info-value">{{ order.items || '0' }} ks</div>
                </div>
                <div class="order-row">
                  <div class="info-label">Cena celkem:</div>
                  <div class="info-value price">{{ formatPrice(order.total) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabulka pro větší obrazovky -->
          <div class="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Č. objednávky</th>
                  <th>Datum</th>
                  <th>Položky</th>
                  <th>Cena celkem</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in filteredOrders" :key="order.id">
                  <td>{{ order.number }}</td>
                  <td>{{ formatDate(order.date) }}</td>
                  <td>{{ order.items || '0' }} ks</td>
                  <td class="price">{{ formatPrice(order.total) }}</td>
                </tr>
              </tbody>
            </table>
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
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores'
import { useRouter } from 'vue-router'
import ProfileSidebar from '@/components/ProfileSidebar.vue'

export default {
  name: 'MojeObjednavky',
  components: {
    ProfileSidebar
  },
  setup() {
    const userStore = useUserStore()
    const router = useRouter()

    // Bezpečnostní kontrola - přesměrování na přihlášení, pokud uživatel není přihlášen
    if (!userStore.isAuthenticated) {
      router.push('/prihlaseni')
    }

    // Stav a proměnné
    const isLoading = ref(true)
    const orders = ref([])
    const error = ref(null)
    const searchQuery = ref('')
    const periodFilter = ref('all')
    const currentPage = ref(1)
    const itemsPerPage = 10

    // Načtení objednávek z API
    const loadOrders = async () => {
      isLoading.value = true
      error.value = null

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'}/api/orders`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userStore.token}`
            }
          }
        )

        if (!response.ok) {
          throw new Error('Nepodařilo se načíst objednávky')
        }

        const result = await response.json()

        if (result.success) {
          // Transformace dat z API do požadovaného formátu
          orders.value = result.orders.map((order) => {
            // Vytvoření čísla objednávky ve formátu OBJ-YYYYMMDD-ID
            const createdDate = new Date(order.created_at)
            const datePart = createdDate.toISOString().slice(0, 10).replace(/-/g, '')
            const orderNumber = `OBJ-${datePart}-${order.id.toString().padStart(4, '0')}`

            return {
              id: order.id,
              number: orderNumber,
              date: order.created_at,
              items: parseInt(order.item_count) || 0,
              total: order.total_price
            }
          })

          // Seřazení od nejnovějších
          orders.value.sort((a, b) => new Date(b.date) - new Date(a.date))
        } else {
          throw new Error(result.message || 'Nepodařilo se načíst objednávky')
        }
      } catch (err) {
        console.error('Chyba při načítání objednávek:', err)
        error.value = err.message
      } finally {
        isLoading.value = false
      }
    }

    // Načtení objednávek při inicializaci stránky
    onMounted(() => {
      loadOrders()
    })

    // Filtrované a stránkované objednávky
    const filteredOrders = computed(() => {
      let result = [...orders.value]

      // Aplikace vyhledávání
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter((order) => order.number.toLowerCase().includes(query))
      }

      // Aplikace filtru období
      if (periodFilter.value !== 'all') {
        const now = new Date()
        let cutoffDate = new Date()

        switch (periodFilter.value) {
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1)
            break
          case '6months':
            cutoffDate.setMonth(now.getMonth() - 6)
            break
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1)
            break
        }

        result = result.filter((order) => new Date(order.date) >= cutoffDate)
      }

      return result
    })

    // Stránkování
    const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage))

    const paginatedOrders = computed(() => {
      const startIndex = (currentPage.value - 1) * itemsPerPage
      return filteredOrders.value.slice(startIndex, startIndex + itemsPerPage)
    })

    // Formátování a pomocné funkce
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('cs-CZ')
    }

    const formatPrice = (price) => {
      return Number(price).toLocaleString('cs-CZ') + ' Kč'
    }

    // Obnovení seznamu objednávek
    const refreshOrders = () => {
      loadOrders()
    }

    return {
      isLoading,
      orders,
      error,
      filteredOrders: paginatedOrders, // Změna na paginatedOrders pro stránkování
      searchQuery,
      periodFilter,
      currentPage,
      totalPages,
      formatDate,
      formatPrice,
      refreshOrders
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

.profile-container {
  max-width: 1200px;
  margin: 0 auto 80px;
  padding: 0 20px;
  font-family: Arial, sans-serif;
}

.profile-content {
  display: flex;
  gap: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Hlavní obsah */
.orders-section {
  flex: 1;
  padding: 30px;
}

h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

h3 {
  color: #555;
  font-size: 18px;
  margin: 15px 0 10px 0;
}

/* Stavy načítání a prázdný stav */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #f5852a;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Error container */
.error-container {
  text-align: center;
  padding: 40px;
  color: #d32f2f;
}

.refresh-button {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: #f5852a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-button:hover {
  background-color: #e67722;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.shop-button {
  display: inline-block;
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #f5852a;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.shop-button:hover {
  background-color: #e67722;
}

/* Filtry */
.filters-row {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-filter {
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

/* Tabulka objednávek - pro větší obrazovky */
.orders-table {
  display: block;
  overflow-x: auto;
}

.orders-table table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.orders-table th {
  background-color: #f8f8f8;
  font-weight: 600;
  color: #333;
}

.price {
  font-weight: 600;
}

/* Karty objednávek - pro mobilní zařízení */
.orders-mobile {
  display: none;
}

.order-card {
  background-color: white;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 15px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
}

.order-number {
  font-weight: 600;
}

.order-info {
  padding: 15px;
}

.order-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.order-row:last-child {
  margin-bottom: 0;
}

.info-label {
  flex: 0 0 100px;
  font-weight: 500;
  color: #555;
}

.info-value {
  flex: 1;
}

/* Stránkování */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.pagination-btn {
  padding: 8px 15px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  color: #666;
}

/* Responzivní design */
@media (max-width: 950px) {
  .profile-content {
    flex-direction: column;
  }

  .orders-table {
    display: none;
  }

  .orders-mobile {
    display: block;
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

  .filters-row {
    flex-direction: column;
    gap: 10px;
  }

  .search-filter,
  .date-filter {
    width: 100%;
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

  .orders-section {
    padding: 20px 15px;
  }

  .pagination {
    flex-direction: column;
    gap: 15px;
  }

  .pagination-btn {
    width: 100%;
  }

  .pagination-pages {
    order: -1;
  }
}
</style>
