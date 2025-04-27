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

    // Nastavíme výchozí stav souhlasu (zamítnut)
    window.dataLayer = window.dataLayer || []
    function gtag(...params) {
      dataLayer.push(params)
    }
    window.gtag = gtag

    // Nastavíme výchozí hodnotu souhlasu na 'denied'
    gtag('consent', 'default', {
      analytics_storage: 'denied'
    })
  },
  methods: {
    acceptAll() {
      // Uložíme volbu do localStorage
      localStorage.setItem('cookie-consent', 'all')
      this.showBanner = false

      // Aktualizujeme stav souhlasu na 'granted'
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted'
        })

        // Zaznamenáme event o udělení souhlasu
        window.gtag('event', 'cookie_consent_granted')
      }

      // Inicializujeme Google Analytics (pokud ještě není)
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
      // Zkontrolujeme, zda již není načteno
      if (typeof window.gtag === 'function' && window.gaInitialized) {
        return
      }

      // Nastavíme příznak, že GA již bylo inicializováno
      window.gaInitialized = true

      // Načteme Google Analytics script
      const script = document.createElement('script')
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-KY9ER5K6Z4'
      script.async = true
      document.head.appendChild(script)

      // Inicializujeme Global Site Tag
      window.dataLayer = window.dataLayer || []
      function gtag(...params) {
        dataLayer.push(params)
      }
      window.gtag = gtag
      gtag('js', new Date())
      gtag('config', 'G-KY9ER5K6Z4')
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
