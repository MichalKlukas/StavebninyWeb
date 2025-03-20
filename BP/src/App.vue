<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import CartDebug from '@/components/debug/CartDebug.vue'

// Development mode check
const isDev = computed(() => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
})
</script>

<template>
  <div class="app">
    <Header></Header>
    <main>
      <RouterView />
    </main>
    <Footer></Footer>

    <!-- Debug component (only shown in development) -->
    <CartDebug v-if="isDev" />
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
</style>
