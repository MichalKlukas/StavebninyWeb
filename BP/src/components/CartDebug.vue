//CartDebug.vue
<template>
  <div class="cart-debug" v-if="showDebug">
    <h3>Cart Debug Info</h3>
    <div class="buttons">
      <button @click="forceLoadLocal">Load Local Cart</button>
      <button @click="forceLoadServer">Load Server Cart</button>
      <button @click="forceSyncCart">Sync Cart</button>
      <button @click="clearLocalStorage">Clear Local Storage</button>
      <button @click="reInit">Re-Initialize Cart</button>
    </div>

    <div class="storage-info">
      <h4>Local Storage Keys:</h4>
      <ul>
        <li v-for="(key, index) in storageKeys" :key="index">
          {{ key }} - {{ storageValues[index] }}
        </li>
      </ul>
    </div>

    <div class="debug-log">
      <h4>Cart Debug Log:</h4>
      <ul>
        <li v-for="(log, index) in cartStore.debugInfo" :key="index">
          {{ log }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/stores/stavKosiku'
import { useUserStore } from '@/stores/index'

const cartStore = useCart()
const userStore = useUserStore()
const showDebug = ref(false)

// Get all localStorage keys
const storageKeys = ref([])
const storageValues = ref([])

function updateStorageInfo() {
  storageKeys.value = []
  storageValues.value = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    storageKeys.value.push(key)

    try {
      const value = localStorage.getItem(key)
      // Truncate long values
      const parsedValue = JSON.parse(value)
      if (parsedValue.items) {
        storageValues.value.push(`${parsedValue.items.length} items`)
      } else {
        storageValues.value.push(value.substring(0, 30) + '...')
      }
    } catch (e) {
      storageValues.value.push(localStorage.getItem(key).substring(0, 30) + '...')
    }
  }
}

function forceLoadLocal() {
  cartStore.loadLocalCart()
  updateStorageInfo()
}

async function forceLoadServer() {
  if (userStore.isAuthenticated) {
    await cartStore.loadServerCart()
  } else {
    alert('User is not authenticated. Cannot load server cart.')
  }
  updateStorageInfo()
}

async function forceSyncCart() {
  if (userStore.isAuthenticated) {
    await cartStore.syncCartWithServer()
  } else {
    alert('User is not authenticated. Cannot sync cart.')
  }
  updateStorageInfo()
}

function clearLocalStorage() {
  const confirmation = confirm('This will remove all cart data from localStorage. Continue?')
  if (confirmation) {
    localStorage.removeItem('kosik_guest')

    if (userStore.user?.id) {
      localStorage.removeItem(`kosik_${userStore.user.id}`)
    }

    // Also clear other potential old keys
    localStorage.removeItem('cart')
    localStorage.removeItem('cart_2')
    localStorage.removeItem('shippingMethod')
    localStorage.removeItem('shipping_2')
    localStorage.removeItem('anonymous_shipping')

    updateStorageInfo()
  }
}

async function reInit() {
  cartStore.initialized = false
  await cartStore.initializeCart()
  updateStorageInfo()
}

onMounted(() => {
  // Check if we're in development mode or if a debug parameter is present
  const isDevMode = process.env.NODE_ENV === 'development'
  const hasDebugParam = window.location.search.includes('debug=true')

  showDebug.value = isDevMode || hasDebugParam

  if (showDebug.value) {
    updateStorageInfo()

    // Set up interval to refresh storage info periodically
    setInterval(updateStorageInfo, 2000)
  }
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

.storage-info,
.debug-log {
  margin-bottom: 20px;
}

h4 {
  margin-bottom: 10px;
}

ul {
  max-height: 200px;
  overflow-y: auto;
  padding-left: 20px;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
}

li {
  font-family: monospace;
  margin-bottom: 5px;
  font-size: 12px;
}
</style>
