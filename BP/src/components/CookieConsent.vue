<template>
  <div v-if="showBanner" class="cookie-banner">
    <p>Používáme cookies pro zlepšení vašeho zážitku.</p>
    <div class="buttons">
      <button @click="acceptAll">Přijmout vše</button>
      <button @click="acceptNecessary">Pouze nezbytné</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showBanner: true
    }
  },
  mounted() {
    // Check if consent was already given
    this.showBanner = !localStorage.getItem('cookie-consent')
  },
  methods: {
    acceptAll() {
      localStorage.setItem('cookie-consent', 'all')
      this.showBanner = false
      this.initializeAnalytics()
    },
    acceptNecessary() {
      localStorage.setItem('cookie-consent', 'necessary')
      this.showBanner = false
    },
    initializeAnalytics() {
      // Initialize Google Analytics here
      if (typeof window.gtag === 'function') {
        // Google Analytics already loaded
      } else {
        // Load Google Analytics
        const script = document.createElement('script')
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-KY9ER5K6Z4'
        script.async = true
        document.head.appendChild(script)

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
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.buttons {
  display: flex;
  gap: 10px;
}
button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:first-child {
  background: #f5852a;
  color: white;
}
button:last-child {
  background: #eee;
}
</style>
