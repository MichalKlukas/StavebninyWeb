<template>
  <div class="cart-debug">
    <h3>Cart Debugger</h3>
    <div class="status-box">
      <div class="status-item">
        <strong>Initialized:</strong> {{ cart.initialized ? 'Yes' : 'No' }}
      </div>
      <div class="status-item"><strong>Items:</strong> {{ cart.items.length }}</div>
      <div class="status-item"><strong>Total Items:</strong> {{ cart.itemCount }}</div>
      <div class="status-item">
        <strong>Total Price:</strong> {{ cart.cartTotal.toFixed(2) }} Kč
      </div>
      <div class="status-item"><strong>Shipping Method:</strong> {{ cart.shippingMethod }}</div>
      <div class="status-item">
        <strong>Shipping Cost:</strong> {{ cart.shipping.toFixed(2) }} Kč
      </div>
      <div class="status-item">
        <strong>Logged In:</strong> {{ user.isLoggedIn ? 'Yes' : 'No' }}
      </div>
      <div class="status-item">
        <strong>User:</strong> {{ user.user ? user.user.email : 'Not logged in' }}
      </div>
      <div class="status-item"><strong>Cart Error:</strong> {{ cart.error || 'None' }}</div>
    </div>

    <div class="actions">
      <h4>Actions</h4>
      <div class="action-buttons">
        <button @click="initCart" :disabled="cart.isLoading">Initialize Cart</button>
        <button @click="resetCart" :disabled="cart.isLoading">Reset Cart</button>
        <button @click="loadUserCart" :disabled="cart.isLoading || !user.isLoggedIn">
          Load Server Cart
        </button>
        <button @click="saveUserCart" :disabled="cart.isLoading || !user.isLoggedIn">
          Save to Server
        </button>
        <button @click="clearCart" :disabled="cart.isLoading">Clear Cart</button>
      </div>
    </div>

    <h4>Cart Items</h4>
    <div v-if="cart.items.length === 0" class="empty-cart">Cart is empty</div>
    <div v-else class="cart-items">
      <div v-for="(item, index) in cart.items" :key="index" class="cart-item">
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-details">
            <span>ID: {{ item.id }}</span>
            <span>Price: {{ item.price }} Kč</span>
            <span>Quantity: {{ item.quantity }}</span>
          </div>
        </div>
        <div class="item-actions">
          <button @click="increaseQuantity(index)" :disabled="cart.isLoading">+</button>
          <button @click="decreaseQuantity(index)" :disabled="cart.isLoading">-</button>
          <button @click="removeItem(index)" :disabled="cart.isLoading">Remove</button>
        </div>
      </div>
    </div>

    <div class="add-item">
      <h4>Add Test Item</h4>
      <div class="form-row">
        <input v-model="newItem.id" placeholder="ID" type="number" min="1" />
        <input v-model="newItem.name" placeholder="Name" />
        <input v-model="newItem.price" placeholder="Price" type="number" min="1" />
        <input v-model="newItem.quantity" placeholder="Quantity" type="number" min="1" />
        <button @click="addTestItem" :disabled="cart.isLoading">Add Item</button>
      </div>
    </div>

    <div class="login-section">
      <h4>Authentication</h4>
      <div v-if="!user.isLoggedIn" class="login-form">
        <div class="form-row">
          <input v-model="loginEmail" placeholder="Email" />
          <input v-model="loginPassword" placeholder="Password" type="password" />
          <button @click="login" :disabled="user.loading">Login</button>
        </div>
      </div>
      <div v-else class="logout-section">
        <div>Logged in as: {{ user.user.email }}</div>
        <button @click="logout" :disabled="user.loading">Logout</button>
      </div>
    </div>

    <div class="localStorage-section">
      <h4>LocalStorage Data</h4>
      <div class="status-item">
        <strong>Cart in localStorage:</strong> {{ localStorageCart ? 'Yes' : 'No' }}
        <span v-if="localStorageCart">({{ parseLocalStorageCart.length }} items)</span>
      </div>
      <div class="status-item">
        <strong>Token in localStorage:</strong> {{ localStorageToken ? 'Yes' : 'No' }}
      </div>
      <div class="status-item">
        <strong>User in localStorage:</strong> {{ localStorageUser ? 'Yes' : 'No' }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useCart } from '../stores/stavKosiku.js'
import { useUserStore } from '../stores/useUserStore.js'
import api from '../config/api'

export default {
  name: 'CartDebug',
  setup() {
    const cart = useCart()
    const user = useUserStore()

    const newItem = ref({
      id: 1001,
      name: 'Test Product',
      price: 100,
      quantity: 1
    })

    const loginEmail = ref('')
    const loginPassword = ref('')

    const localStorageCart = computed(() => localStorage.getItem('cart'))
    const localStorageToken = computed(() => localStorage.getItem('token'))
    const localStorageUser = computed(() => localStorage.getItem('user'))

    const parseLocalStorageCart = computed(() => {
      try {
        return localStorageCart.value ? JSON.parse(localStorageCart.value) : []
      } catch (err) {
        return []
      }
    })

    onMounted(() => {
      // Check if cart is initialized
      if (!cart.initialized) {
        cart.initCart()
      }
    })

    // Cart actions
    const initCart = () => cart.initCart()
    const resetCart = () => cart.resetCart()
    const loadUserCart = () => cart.loadUserCart()
    const saveUserCart = () => cart.saveUserCart()
    const clearCart = () => cart.clearCart()
    const removeItem = (index) => cart.removeFromCart(index)
    const increaseQuantity = (index) => cart.increaseQuantity(index)
    const decreaseQuantity = (index) => cart.decreaseQuantity(index)

    const addTestItem = () => {
      cart.addToCart({
        id: parseInt(newItem.value.id) || 1001,
        name: newItem.value.name || 'Test Product',
        price: parseFloat(newItem.value.price) || 100,
        quantity: parseInt(newItem.value.quantity) || 1
      })
    }

    // Auth actions
    const login = async () => {
      if (!loginEmail.value || !loginPassword.value) return

      try {
        const response = await api.post('/api/login', {
          email: loginEmail.value,
          password: loginPassword.value
        })

        if (response.data && response.data.token) {
          await user.login(response.data.user, response.data.token)
          loginPassword.value = ''
        }
      } catch (err) {
        console.error('Login failed:', err)
        alert('Login failed: ' + (err.response?.data?.error || err.message))
      }
    }

    const logout = async () => {
      await user.logout()
    }

    return {
      cart,
      user,
      newItem,
      loginEmail,
      loginPassword,
      localStorageCart,
      localStorageToken,
      localStorageUser,
      parseLocalStorageCart,
      initCart,
      resetCart,
      loadUserCart,
      saveUserCart,
      clearCart,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      addTestItem,
      login,
      logout
    }
  }
}
</script>

<style scoped>
.cart-debug {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-family: Arial, sans-serif;
}

h3 {
  margin-top: 0;
  color: #333;
}

.status-box {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
}

.status-item {
  margin-bottom: 5px;
}

.actions {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.cart-items {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  margin-bottom: 5px;
  border-radius: 4px;
}

.item-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.item-details {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 5px;
}

.empty-cart {
  padding: 20px;
  text-align: center;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #888;
}

.add-item,
.login-section,
.localStorage-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
}

h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.login-form,
.logout-section {
  margin-top: 10px;
}

.logout-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
