<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import CartDebug from '@/components/debug/CartDebug.vue'
import StoreDebug from '@/components/debug/StoreDebug.vue'
import { useUserStore } from '@/stores/useUserStore.js'
import { useCart } from '@/stores/stavKosiku.js'

// Development mode check
const isDev = ref(true)
const isInitializing = ref(true)

// Initialize user and cart on mount
onMounted(async () => {
  console.log('[App] Initializing application')

  try {
    // Fix token format if needed
    const token = localStorage.getItem('token')
    if (token && !token.startsWith('Bearer ')) {
      console.log('[App] Fixing token format')
      const fixedToken = `Bearer ${token}`
      localStorage.setItem('token', fixedToken)
    }

    // Initialize user store
    const userStore = useUserStore()
    await userStore.init()
    console.log('[App] User state initialized, isLoggedIn:', userStore.isLoggedIn)

    // Initialize cart store
    const cartStore = useCart()
    await cartStore.initCart()
    console.log('[App] Cart initialized, itemCount:', cartStore.itemCount)
  } catch (error) {
    console.error('[App] Error during initialization:', error)
  } finally {
    // Hide loading overlay
    isInitializing.value = false
  }
})

// Toggle store debugger
const showStoreDebug = ref(true)
</script>

<template>
  <div class="app">
    <Header></Header>

    <!-- Loading overlay when initializing -->
    <div class="loading-overlay" v-if="isInitializing">
      <div class="spinner"></div>
      <div class="loading-message">Načítání aplikace...</div>
    </div>

    <main v-else>
      <RouterView />
    </main>

    <Footer></Footer>

    <!-- Debug components (only shown in development) -->
    <CartDebug v-if="isDev" />
    <StoreDebug v-if="isDev && showStoreDebug" />

    <!-- Toggle button for store debugger -->
    <button v-if="isDev" class="toggle-debug-btn" @click="showStoreDebug = !showStoreDebug">
      {{ showStoreDebug ? 'Hide' : 'Show' }} Store Debug
    </button>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #f5852a;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-message {
  font-size: 18px;
  color: #333;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.toggle-debug-btn {
  position: fixed;
  bottom: 10px;
  left: 10px;
  background: #333;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  z-index: 9999;
  font-size: 12px;
}
</style>
