<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import CartDebug from '@/components/debug/CartDebug.vue'
import StoreDebug from '@/components/debug/StoreDebug.vue'

// Development mode check
const isDev = computed(() => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
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
