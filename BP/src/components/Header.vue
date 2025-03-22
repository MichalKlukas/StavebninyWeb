<template>
  <header>
    <div class="top-bar">
      <div class="top-nav-container">
        <nav class="top-nav">
          <div class="nav-links-left">
            <a href="/" class="nav-link home-link mobile-hidden">
              <span class="icon">
                <img src="@/assets/ikonkyHeader/domu.png" alt="Domů" class="icon-img" />
              </span>
              <span class="nav-text">Domů</span>
            </a>
            <a href="/o-nas" class="nav-link">
              <span class="icon">
                <img src="@/assets/ikonkyHeader/oNas.png" alt="O nás" class="icon-img" />
              </span>
              <span class="nav-text">O nás</span>
            </a>
            <a href="/mateDotaz" class="nav-link">
              <span class="icon">
                <img src="@/assets/ikonkyHeader/mateDotaz.png" alt="Máte dotaz?" class="icon-img" />
              </span>
              <span class="nav-text">Máte dotaz?</span>
            </a>
            <a href="/poptavka" class="nav-link">
              <span class="icon">
                <img src="@/assets/ikonkyHeader/poptavka.png" alt="Poptávka" class="icon-img" />
              </span>
              <span class="nav-text">Poptávka</span>
            </a>
          </div>

          <div class="contact-info">
            <div class="contact-item opening-hours">
              <span class="icon">
                <img
                  src="@/assets/ikonkyHeader/oteviraciDoba.png"
                  alt="Otevírací doba"
                  class="icon-img"
                />
              </span>
              <span class="contact-text">po-pá 7:00 - 17:00, so 7:00 - 12:00</span>
            </div>
            <div class="contact-item location">
              <span class="icon">
                <img src="@/assets/ikonkyHeader/poloha.png" alt="Adresa" class="icon-img" />
              </span>
              <span class="contact-text">Lysá nad Labem, Sokolovská 1143</span>
            </div>
            <div class="contact-item phone">
              <span class="icon">
                <img src="@/assets/ikonkyHeader/telefon.png" alt="Telefon" class="icon-img" />
              </span>
              <span class="contact-text">775 315 349</span>
            </div>
            <div class="contact-item email">
              <span class="icon">
                <img src="@/assets/ikonkyHeader/mail.png" alt="Email" class="icon-img" />
              </span>
              <span class="contact-text">stavebninybaroch@seznam.cz</span>
            </div>
          </div>
        </nav>
      </div>
    </div>

    <div class="main-header">
      <div class="container">
        <div class="header-wrapper">
          <div class="logo-container">
            <router-link to="/">
              <img src="@/assets/logo.png" alt="Stavebniny Lysa logo" class="logo" />
            </router-link>
          </div>

          <div class="search-bar-container">
            <form @submit.prevent="handleSearch" class="search-bar">
              <input
                type="text"
                placeholder="Hledat..."
                class="search-input"
                v-model="searchQuery"
              />
              <button type="submit" class="search-button">
                <svg
                  class="search-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>
          </div>

          <div class="user-actions">
            <!-- Přihlášený uživatel -->
            <div v-if="userStore.isAuthenticated" class="user-dropdown">
              <button class="user-profile-btn" @click="toggleDropdown">
                <span class="user-initials">{{ userStore.userInitials }}</span>
              </button>

              <!-- Dropdown menu po kliknutí na iniciály -->
              <div v-if="dropdownOpen" class="dropdown-menu">
                <router-link to="/profil" class="dropdown-item">Můj profil</router-link>
                <router-link to="/objednavky" class="dropdown-item">Moje objednávky</router-link>
                <div class="dropdown-divider"></div>
                <button @click="logout" class="dropdown-item logout-btn">Odhlásit se</button>
              </div>
            </div>

            <!-- Nepřihlášený uživatel -->
            <router-link v-else to="/prihlaseni" class="user-action login-btn">
              <span class="icon">👤</span>
              <span class="action-text">Přihlásit</span>
            </router-link>

            <router-link to="/cart" class="user-action cart-btn">
              <span class="icon">🛒</span>
              <span class="action-text">{{ formatCartTotal }}</span>
              <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="category-nav">
      <div class="container">
        <nav class="categories">
          <router-link to="/kategorie/hruba-stavba-a-zelezo" class="category-link"
            >Hrubá stavba a železo</router-link
          >
          <router-link to="/kategorie/fasada" class="category-link">Fasáda</router-link>
          <router-link to="/kategorie/drevo-a-strecha" class="category-link"
            >Dřevo a střecha</router-link
          >
          <router-link to="/kategorie/sypke-smesi" class="category-link">Sypké směsi</router-link>
          <router-link to="/kategorie/betonove-vyrobky" class="category-link"
            >Betonové výrobky</router-link
          >
          <router-link to="/kategorie/zdici-materialy" class="category-link"
            >Zdící materiály</router-link
          >
          <router-link to="/kategorie/chemie-a-barvy" class="category-link"
            >Chemie a barvy</router-link
          >
          <router-link to="/kategorie/spojovaci-material" class="category-link"
            >Spojovací materiál</router-link
          >
          <router-link to="/kategorie/elektro-a-naradi" class="category-link"
            >Elektro a nářadí</router-link
          >
          <router-link to="/kategorie/sadrokarton" class="category-link">Sádrokarton</router-link>
          <router-link to="/kategorie/ostatni" class="category-link">Ostatní</router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed } from 'vue'
import { useUserStore } from '../stores'
import { useRouter } from 'vue-router'
import { useCart } from '@/stores/stavKosiku.ts'

export default defineComponent({
  name: 'Header',
  setup() {
    const userStore = useUserStore()
    const router = useRouter()
    const dropdownOpen = ref(false)
    const cart = useCart()
    const searchQuery = ref('')
    const cartItemCount = computed(() => cart.itemCount.value)

    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        // Encode the search query for URL
        const query = encodeURIComponent(searchQuery.value.trim())
        // Navigate to search results page with the query
        router.push(`/search?q=${query}`)
        // Clear the search input
        searchQuery.value = ''
      }
    }

    // Formátovaná celková cena košíku
    const formatCartTotal = computed(() => {
      const total = cart.cartTotal.value || 0
      return (
        total.toLocaleString('cs-CZ', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kč'
      )
    })

    // Funkce pro přepínání dropdown menu
    const toggleDropdown = () => {
      dropdownOpen.value = !dropdownOpen.value
    }

    // Funkce pro odhlášení
    const logout = () => {
      userStore.logout()
      dropdownOpen.value = false
      router.push('/')
    }

    // Funkce pro zavření dropdown po kliknutí mimo
    const closeDropdown = (e: MouseEvent) => {
      if (!e.target || !(e.target as HTMLElement).closest('.user-dropdown')) {
        dropdownOpen.value = false
      }
    }

    // Nastavení a odstranění event listenerů
    onMounted(() => {
      document.addEventListener('click', closeDropdown)
    })

    onUnmounted(() => {
      document.removeEventListener('click', closeDropdown)
    })

    return {
      userStore,
      dropdownOpen,
      toggleDropdown,
      logout,
      cart,
      formatCartTotal,
      searchQuery,
      handleSearch,
      cartItemCount
    }
  }
})
</script>

<style scoped>
header {
  width: 100%;
  font-family: 'Arial', sans-serif;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.top-bar {
  background-color: #f8f8f8;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.top-nav-container {
  width: 100%;
  padding: 0 15px;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
}

.nav-links-left,
.contact-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.nav-link {
  text-decoration: none;
  color: #555;
  font-size: 14px;
  transition: color 0.2s;
  position: relative;
  display: flex;
  align-items: center;
}

.nav-link:hover {
  color: #f5852a;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #f5852a;
  transition: width 0.3s;
}

.nav-link:hover::after {
  width: 100%;
}

.mobile-hidden {
  display: flex;
}

.nav-text {
  display: inline-block;
}

.contact-info {
  margin-left: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #555;
}

.icon {
  margin-right: 6px;
  display: flex;
  align-items: center;
}

.icon-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.contact-text {
  font-size: 14px;
  white-space: nowrap;
}

.main-header {
  padding: 20px 0;
  background-color: white;
}

.main-header .container {
  display: flex;
  flex-direction: column;
}

.header-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
}

.logo-container {
  flex: 0 0 auto;
}

.logo {
  height: 50px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.search-bar-container {
  flex: 1 1 auto;
}

.search-bar {
  width: 100%;
  position: relative;
  display: flex;
}

.search-input {
  width: 100%;
  padding: 12px 50px 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #f5852a;
  box-shadow: 0 0 0 2px rgba(245, 133, 42, 0.2);
}
.search-button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-button:hover .search-icon {
  stroke: #f5852a;
}
.search-icon {
  width: 18px;
  height: 18px;
  stroke: #777;
  transition: stroke 0.2s;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-action {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s;
  position: relative; /* Pro badge */
}

.user-action:hover {
  background-color: #f0f0f0;
  color: #f5852a;
}

.action-text {
  margin-left: 8px;
  display: inline-block;
}

.login-btn {
  order: 1;
}

.cart-btn {
  order: 2;
  background-color: #f5f5f5;
}

/* Badge pro košík */
.cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #f5852a;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* Nové styly pro user dropdown */
.user-dropdown {
  position: relative;
  order: 1;
}

.user-profile-btn {
  background-color: #f5852a;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  cursor: pointer;
  font-size: 16px;
}

.dropdown-menu {
  position: absolute;
  top: 45px;
  right: 0;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  min-width: 180px;
  z-index: 100;
}

.dropdown-item {
  display: block;
  padding: 12px 16px;
  text-decoration: none;
  color: #333;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
  color: #f5852a;
}

.dropdown-divider {
  border-top: 1px solid #eee;
  margin: 5px 0;
}

.logout-btn {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.category-nav {
  background-color: white;
  border-bottom: 1px solid #eee;
  padding: 15px 0;
}

.categories {
  display: flex;
  gap: 25px;
  overflow-x: auto;
  padding-bottom: 5px;
  scrollbar-width: thin;
  justify-content: space-between;
}

.categories::-webkit-scrollbar {
  height: 3px;
}

.categories::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.categories::-webkit-scrollbar-thumb {
  background: #ddd;
}

.category-link {
  text-decoration: none;
  color: #333;
  white-space: nowrap;
  font-weight: 500;
  padding-bottom: 5px;
  position: relative;
  transition: color 0.2s;
}

.category-link:hover {
  color: #f5852a;
}

.category-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #f5852a;
  transition: width 0.3s;
}

.category-link:hover::after {
  width: 100%;
}

/* Responsive Design */
@media (max-width: 1300px) {
  .contact-info .phone {
    display: none;
  }
}

@media (max-width: 1200px) {
  .contact-info .phone,
  .contact-info .location {
    display: none;
  }

  .header-wrapper {
    flex-wrap: wrap;
    gap: 15px;
  }

  .search-bar-container {
    order: 3;
    width: 100%;
  }

  .logo-container,
  .user-actions {
    flex: 0 0 auto;
  }
}

@media (max-width: 992px) {
  .contact-info .email,
  .contact-info .phone,
  .contact-info .location {
    display: none;
  }

  .header-wrapper {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .top-nav {
    flex-direction: row;
    align-items: stretch;
    display: flex;
    width: 100%;
  }

  .nav-links-left,
  .contact-info {
    flex-direction: row;
    align-items: center;
  }

  .header-wrapper {
    justify-content: space-between;
  }

  .logo-container {
    order: 1;
  }

  .user-actions {
    order: 2;
  }

  .search-bar-container {
    order: 3;
    width: 100%;
  }

  .mobile-hidden {
    display: none;
  }

  .logo {
    height: 40px;
  }
}

@media (max-width: 576px) {
  .nav-links-left {
    flex-direction: row;
    justify-content: center;
    display: flex;
    width: 100%;
  }

  .contact-info {
    display: none;
  }

  .nav-links-left {
    gap: 15px;
  }

  .nav-link .nav-text {
    white-space: nowrap;
  }

  .header-wrapper {
    align-items: center;
  }

  .logo {
    height: 35px;
  }

  .user-actions {
    gap: 5px;
  }

  .user-action {
    padding: 6px 8px;
  }

  .nav-link {
    flex-shrink: 0;
  }
}

@media (max-width: 380px) {
  .action-text {
    display: none;
  }
}
</style>
