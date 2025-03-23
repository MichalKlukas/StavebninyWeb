<template>
  <div class="cart-debug" v-if="showDebug">
    <h3>Cart Debug Info</h3>
    <div class="buttons">
      <!-- Reload server cart (if logged in) -->
      <button @click="forceLoadServer">Load Server Cart</button>
      <!-- Clear cart in memory (and optionally on server) -->
      <button @click="forceClearCart">Clear Cart</button>
    </div>

    <div class="debug-data">
      <h4>Cart Items (in memory):</h4>
      <pre>{{ cartStore.items }}</pre>
    </div>

    <div class="user-data">
      <h4>User Info:</h4>
      <pre>{{ userStore.user }}</pre>
      <p>Token: {{ userStore.token }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCart } from '@/stores/stavKosiku'
import { useUserStore } from '@/stores/index'

const cartStore = useCart()
const userStore = useUserStore()

// Decide when to show the debug panel
const showDebug = ref(false)

async function forceLoadServer() {
  if (userStore.isAuthenticated) {
    await cartStore.loadServerCart()
  } else {
    alert('User is not authenticated. Cannot load server cart.')
  }
}

async function forceClearCart() {
  await cartStore.clearCart()
}

// On mount, decide if we want to show debug info
onMounted(() => {
  // e.g., show debug if dev mode or ?debug=true
  const isDevMode = import.meta.env.MODE === 'development'
  const hasDebugParam = window.location.search.includes('debug=true')
  showDebug.value = isDevMode || hasDebugParam
})
</script>

<style scoped>
.cart-debug {
  margin-top: 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.buttons {
  margin-bottom: 15px;
}
button {
  margin-right: 10px;
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
.debug-data,
.user-data {
  margin-bottom: 20px;
}
pre {
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
