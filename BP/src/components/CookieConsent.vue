<template>
  <div v-if="showBanner" class="cookie-banner">
    <div class="cookie-content">
      <h2>Používáme cookies</h2>
      <p>Tento web používá cookies pro zlepšení vašeho zážitku a analýzu návštěvnosti.</p>
      <div class="buttons">
        <button @click="acceptAll" class="btn-accept">Přijmout vše</button>
        <button @click="acceptNecessary" class="btn-necessary">Pouze nezbytné</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CookieConsent',
  data() {
    return {
      showBanner: true
    }
  },
  mounted() {
    // Při načtení stránky zkontrolujeme, zda uživatel již dal souhlas
    const cookieConsent = localStorage.getItem('cookie-consent')
    this.showBanner = !cookieConsent

    // Pokud už dříve přijal všechny cookies, inicializujeme Google Analytics
    if (cookieConsent === 'all') {
      this.initializeAnalytics()
    }
  },
  methods: {
    acceptAll() {
      // Uložíme volbu do localStorage
      localStorage.setItem('cookie-consent', 'all')
      this.showBanner = false

      console.log('Cookie consent accepted, updating analytics_storage to granted')

      // Aktualizujeme stav souhlasu na 'granted'
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted'
        })

        // Zaznamenáme event o udělení souhlasu
        window.gtag('event', 'cookie_consent_granted')
      } else {
        console.error('gtag is not defined at consent time!')
      }

      // Inicializujeme Google Analytics
      this.initializeAnalytics()
    },
    acceptNecessary() {
      // Uložíme volbu do localStorage
      localStorage.setItem('cookie-consent', 'necessary')
      this.showBanner = false

      // Zaznamenáme event o udělení omezeného souhlasu (pokud již bylo GA načteno)
      if (window.gtag) {
        window.gtag('event', 'cookie_consent_necessary_only')
      }
    },
    initializeAnalytics() {
      if (window.gtag) {
        // Povolíme odesílání dat
        window.gtag('consent', 'update', {
          analytics_storage: 'granted'
        })

        // Odešleme page_view událost
        window.gtag('event', 'page_view')

        console.log('Analytics initialized with consent granted')
      } else {
        console.error('gtag is not available for initialization')
      }
    }
  }
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  padding: 15px;
  border-top: 1px solid #eee;
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h2 {
  margin: 0;
  font-size: 18px;
}

.buttons {
  display: flex;
  gap: 10px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-accept {
  background-color: #f5852a;
  color: white;
}

.btn-necessary {
  background-color: #eee;
  color: #333;
}

@media (min-width: 768px) {
  .cookie-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .buttons {
    margin-left: auto;
  }
}
</style>
