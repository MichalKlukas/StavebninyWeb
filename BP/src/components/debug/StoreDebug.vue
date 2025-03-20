<template>
  <div class="store-debug">
    <h3>Store Debugger</h3>

    <div class="debug-section">
      <h4>User Store</h4>
      <div><strong>Logged in:</strong> {{ userStatus.isLoggedIn }}</div>
      <div><strong>User:</strong> {{ userStatus.userName }}</div>
      <div><strong>Token:</strong> {{ userStatus.hasToken ? 'Present' : 'Missing' }}</div>
      <div><strong>Token Format:</strong> {{ userStatus.tokenFormat }}</div>
      <button @click="resetUser">Reset User Store</button>
    </div>

    <div class="debug-section">
      <h4>Cart Store</h4>
      <div><strong>Initialized:</strong> {{ cartStatus.initialized }}</div>
      <div><strong>Items:</strong> {{ cartStatus.itemCount }}</div>
      <div><strong>Error:</strong> {{ cartStatus.lastError || 'None' }}</div>
      <button @click="resetCart">Reset Cart</button>
      <button @click="initializeCart">Initialize Cart</button>
    </div>

    <div class="debug-section">
      <h4>Local Storage</h4>
      <div><strong>Token:</strong> {{ localStorageData.token ? 'Present' : 'Missing' }}</div>
      <div><strong>User:</strong> {{ localStorageData.user ? 'Present' : 'Missing' }}</div>
      <div><strong>Cart:</strong> {{ localStorageData.cart ? 'Present' : 'Missing' }}</div>
      <button @click="clearLocalStorage">Clear All</button>
      <button @click="fixTokenFormat">Fix Token Format</button>
    </div>

    <div class="debug-section">
      <h4>API Test</h4>
      <button @click="testHealthEndpoint">Test Health</button>
      <button @click="testCartEndpoint">Test Cart API</button>
      <div v-if="apiResponse" class="api-response">
        <pre>{{ apiResponse }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import { useCart } from '@/stores/stavKosiku'
import axios from 'axios'
import API_URL from '@/config/api'

const userStore = useUserStore()
const cartStore = useCart()
const apiResponse = ref(null)

// Local storage data
const localStorageData = ref({
  token: null,
  user: null,
  cart: null
})

// User store status
const userStatus = computed(() => {
  try {
    return userStore.getAuthStatus
      ? userStore.getAuthStatus()
      : {
          isLoggedIn: userStore.isLoggedIn,
          userName: userStore.user?.email || 'None',
          hasToken: !!userStore.token,
          tokenFormat: userStore.token
            ? userStore.token.startsWith('Bearer ')
              ? 'Bearer format'
              : 'Missing Bearer prefix'
            : 'No token'
        }
  } catch (error) {
    return { error: error.message }
  }
})

// Cart store status
const cartStatus = computed(() => {
  try {
    return cartStore.getStatus
      ? cartStore.getStatus()
      : {
          initialized: 'Unknown',
          itemCount: cartStore.items?.length || 0,
          lastError: 'No getStatus method available'
        }
  } catch (error) {
    return { error: error.message }
  }
})

// Update local storage data
const updateLocalStorageData = () => {
  localStorageData.value = {
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user'),
    cart: localStorage.getItem('kosik')
  }
}

// Reset user store
const resetUser = () => {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // Force user store reset
    if (typeof userStore.init === 'function') {
      userStore.init()
    }

    updateLocalStorageData()
    alert('User store reset')
  } catch (error) {
    alert(`Error: ${error.message}`)
  }
}

// Reset cart
const resetCart = () => {
  try {
    localStorage.removeItem('kosik')

    // Clear cart if method exists
    if (typeof cartStore.clearCart === 'function') {
      cartStore.clearCart()
    }

    updateLocalStorageData()
    alert('Cart reset')
  } catch (error) {
    alert(`Error: ${error.message}`)
  }
}

// Initialize cart
const initializeCart = async () => {
  try {
    if (typeof cartStore.initCart === 'function') {
      await cartStore.initCart()
      alert('Cart initialized')
    } else {
      alert('initCart method not found')
    }
  } catch (error) {
    alert(`Error: ${error.message}`)
  }
}

// Clear local storage
const clearLocalStorage = () => {
  localStorage.clear()
  updateLocalStorageData()
  alert('LocalStorage cleared')
}

// Fix token format
const fixTokenFormat = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    alert('No token found')
    return
  }

  if (!token.startsWith('Bearer ')) {
    const fixedToken = `Bearer ${token}`
    localStorage.setItem('token', fixedToken)
    alert('Token format fixed')
  } else {
    alert('Token already has Bearer prefix')
  }

  updateLocalStorageData()
}

// Test health endpoint
const testHealthEndpoint = async () => {
  try {
    apiResponse.value = 'Loading...'
    const response = await axios.get(`${API_URL}/api/health`)
    apiResponse.value = JSON.stringify(response.data, null, 2)
  } catch (error) {
    apiResponse.value = `Error: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data, null, 2) : ''}`
  }
}

// Test cart endpoint
const testCartEndpoint = async () => {
  try {
    apiResponse.value = 'Loading...'

    const token = localStorage.getItem('token')
    if (!token) {
      apiResponse.value = 'Error: No authentication token found'
      return
    }

    const response = await axios.get(`${API_URL}/api/user/cart`, {
      headers: { Authorization: token }
    })

    apiResponse.value = JSON.stringify(response.data, null, 2)
  } catch (error) {
    apiResponse.value = `Error: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data, null, 2) : ''}`
  }
}

onMounted(() => {
  updateLocalStorageData()
})
</script>

<style scoped>
.store-debug {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 350px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  font-size: 12px;
  max-height: 95vh;
  overflow-y: auto;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.debug-section {
  margin-bottom: 15px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

button {
  background: #4a90e2;
  color: white;
  border: none;
  padding: 5px 8px;
  margin: 5px 5px 0 0;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}

button:hover {
  background: #3a80d2;
}

.api-response {
  margin-top: 10px;
  max-height: 150px;
  overflow-y: auto;
  background: #f0f0f0;
  padding: 5px;
  border-radius: 3px;
  font-size: 11px;
}

pre {
  margin: 0;
  white-space: pre-wrap;
}
</style>
