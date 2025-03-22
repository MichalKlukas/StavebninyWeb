<template>
  <div class="cart-debug-panel">
    <h3>Cart Debug Panel</h3>
    <button @click="forceReload" class="debug-button">Force Page Reload</button>
    <button @click="clearStorage" class="debug-button">Clear LocalStorage</button>
    <button @click="refreshCart" class="debug-button">Refresh Cart</button>
    <button @click="resetAndRefresh" class="debug-button">Reset & Refresh Cart</button>

    <div class="debug-info">
      <h4>User Info:</h4>
      <p>Logged in: {{ userStore.isLoggedIn }}</p>
      <p>User ID: {{ userStore.user?.id || 'Not logged in' }}</p>
      <p>Email: {{ userStore.user?.email || 'N/A' }}</p>

      <h4>Cart Info:</h4>
      <p>Items: {{ cartStore.items.length }}</p>
      <p>Total items: {{ cartStore.itemCount }}</p>
      <p>Initialized: {{ cartStore.initialized }}</p>
      <p>Last sync: {{ lastSync }}</p>
      <p>Error: {{ cartStore.error || 'None' }}</p>

      <h4>LocalStorage:</h4>
      <p>Cart in localStorage: {{ hasLocalCart ? 'Yes' : 'No' }}</p>
      <p>User in localStorage: {{ hasLocalUser ? 'Yes' : 'No' }}</p>
      <p>Token in localStorage: {{ hasLocalToken ? 'Yes' : 'No' }}</p>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/useUserStore'
import { useCart } from '@/stores/stavKosiku'
import { computed } from 'vue'

export default {
  setup() {
    const userStore = useUserStore()
    const cartStore = useCart()

    const hasLocalCart = computed(() => localStorage.getItem('cart') !== null)
    const hasLocalUser = computed(() => localStorage.getItem('user') !== null)
    const hasLocalToken = computed(() => localStorage.getItem('token') !== null)

    const lastSync = computed(() => {
      return cartStore.lastSyncTime ? new Date(cartStore.lastSyncTime).toLocaleString() : 'Never'
    })

    const forceReload = () => {
      window.location.reload()
    }

    const clearStorage = () => {
      localStorage.removeItem('cart')
      localStorage.removeItem('shippingMethod')
      alert('LocalStorage cart cleared')
    }

    const refreshCart = async () => {
      try {
        await cartStore.refreshCart()
        alert('Cart refreshed from server')
      } catch (err) {
        alert(`Error: ${err.message}`)
      }
    }

    const resetAndRefresh = async () => {
      try {
        // Clear local variables
        cartStore.items = []
        cartStore.resetInitialization()
        localStorage.removeItem('cart')
        localStorage.removeItem('shippingMethod')

        // Re-init cart
        await cartStore.initCart()
        alert('Cart reset and refreshed')
      } catch (err) {
        alert(`Error: ${err.message}`)
      }
    }

    return {
      userStore,
      cartStore,
      hasLocalCart,
      hasLocalUser,
      hasLocalToken,
      lastSync,
      forceReload,
      clearStorage,
      refreshCart,
      resetAndRefresh
    }
  }
}
</script>

<style scoped>
.cart-debug-panel {
  position: fixed;
  bottom: 10px;
  right: 10px;
  width: 300px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  z-index: 9999;
  font-family: Arial, sans-serif;
  font-size: 12px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  max-height: 80vh;
  overflow-y: auto;
}

.debug-button {
  background: #4a90e2;
  color: white;
  border: none;
  padding: 5px 8px;
  margin: 3px;
  border-radius: 3px;
  cursor: pointer;
}

.debug-button:hover {
  background: #3483d9;
}

h3,
h4 {
  margin: 5px 0;
}

.debug-info {
  margin-top: 10px;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

p {
  margin: 5px 0;
}
</style>
