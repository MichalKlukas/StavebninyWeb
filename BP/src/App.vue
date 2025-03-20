<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import CartDebug from '@/components/debug/CartDebug.vue'
import StoreDebug from '@/components/debug/StoreDebug.vue'
import { useUserStore } from '@/stores/useUserStore.js'
import { useCart } from '@/stores/stavKosiku.js'

// Development mode check - force to true for now
const isDev = ref(true)

// Force fix token format and reinitialize stores
onMounted(async () => {
  console.log('[App] Mounted, checking token format')

  // Fix token format
  const token = localStorage.getItem('token')
  if (token && !token.startsWith('Bearer ')) {
    console.log('[App] Fixing token format')
    const fixedToken = `Bearer ${token}`
    localStorage.setItem('token', fixedToken)

    // Force re-initialize user store
    const userStore = useUserStore()
    if (typeof userStore.init === 'function') {
      userStore.init()
    }

    // Force re-initialize cart
    const cartStore = useCart()
    if (typeof cartStore.initCart === 'function') {
      await cartStore.initCart()
    }

    console.log('[App] Token format fixed and stores reinitialized')
  }
})

// Toggle store debugger
const showStoreDebug = ref(true)
</script>

<template>
  <div class="app">
    <Header></Header>
    <main>
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
