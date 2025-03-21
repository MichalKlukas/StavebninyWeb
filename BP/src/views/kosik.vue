<!-- src/views/kosik.vue -->
<template>
  <div class="cart-page">
    <div class="HeadingStrip">
      <h1>Košík</h1>
    </div>

    <div class="cart-container">
      <!-- Loading state -->
      <div class="cart-loading" v-if="isLoading">
        <div class="spinner"></div>
        <p>Načítání košíku...</p>
      </div>

      <!-- Empty cart -->
      <div class="empty-cart" v-else-if="!items.length">
        <div class="empty-cart-content">
          <h2>Váš košík je prázdný</h2>
          <p>Přidejte si zboží do košíku a pokračujte v nákupu.</p>
          <router-link to="/" class="continue-shopping">Pokračovat v nákupu</router-link>
        </div>
      </div>

      <!-- Cart with items -->
      <div class="cart-content" v-else>
        <div class="cart-items-container">
          <h2>Položky v košíku</h2>

          <!-- List of cart items -->
          <div class="cart-items">
            <div class="cart-item" v-for="(item, index) in items" :key="item.id">
              <div class="item-image">
                <img :src="item.image" :alt="item.name" />
              </div>

              <div class="item-details">
                <h3 class="item-name">{{ item.name }}</h3>
                <p class="item-price">
                  {{ formatPrice(item.price) }} / {{ item.priceUnit || 'ks' }}
                </p>
              </div>

              <div class="item-quantity">
                <button
                  class="quantity-btn decrease"
                  @click="decreaseQuantity(index)"
                  :disabled="isLoading"
                >
                  -
                </button>
                <span class="quantity-value">{{ item.quantity }}</span>
                <button
                  class="quantity-btn increase"
                  @click="increaseQuantity(index)"
                  :disabled="isLoading"
                >
                  +
                </button>
              </div>

              <div class="item-subtotal">
                {{ formatPrice(item.price * item.quantity) }}
              </div>

              <button class="remove-item" @click="removeFromCart(index)" :disabled="isLoading">
                ×
              </button>
            </div>
          </div>

          <div class="cart-actions">
            <router-link to="/" class="continue-shopping">Pokračovat v nákupu</router-link>
            <button class="clear-cart" @click="clearCart" :disabled="isLoading">
              Vyprázdnit košík
            </button>
          </div>
        </div>

        <div class="cart-summary">
          <h2>Souhrn objednávky</h2>

          <div class="summary-row">
            <span>Mezisoučet:</span>
            <span>{{ formatPrice(cartTotal) }}</span>
          </div>

          <div class="shipping-options">
            <h3>Způsob doručení:</h3>

            <div class="shipping-option">
              <input
                type="radio"
                id="pickup"
                value="pickup"
                v-model="shippingMethod"
                @change="updateShippingMethod"
              />
              <label for="pickup">
                <strong>Osobní odběr</strong>
                <span>Zdarma</span>
              </label>
            </div>

            <div class="shipping-option">
              <input
                type="radio"
                id="delivery"
                value="delivery"
                v-model="shippingMethod"
                @change="updateShippingMethod"
              />
              <label for="delivery">
                <strong>Doručení na adresu</strong>
                <span v-if="cartTotal > 2000">Zdarma</span>
                <span v-else>200 Kč</span>
              </label>
            </div>
          </div>

          <div class="summary-row total">
            <span>Celkem:</span>
            <span>{{ formatPrice(cartTotal + shipping) }}</span>
          </div>

          <button class="checkout-button" @click="proceedToCheckout">Pokračovat k pokladně</button>

          <div class="login-prompt" v-if="!isAuthenticated">
            <p>
              Pro dokončení objednávky se prosím
              <router-link to="/prihlaseni">přihlaste</router-link> nebo
              <router-link to="/registrace">zaregistrujte</router-link>.
            </p>
          </div>
        </div>
      </div>

      <!-- Error message -->
      <div class="error-message" v-if="error">
        <p>{{ error }}</p>
        <button @click="initCart">Zkusit znovu</button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/useUserStore'

export default {
  name: 'CartPage',
  setup() {
    const router = useRouter()
    const cartStore = useCartStore()
    const userStore = useUserStore()

    // Local copy of cart state for reactivity
    const items = computed(() => cartStore.items)
    const shippingMethod = ref(cartStore.shippingMethod)
    const isLoading = computed(() => cartStore.isLoading)
    const error = computed(() => cartStore.error)
    const cartTotal = computed(() => cartStore.cartTotal)
    const shipping = computed(() => cartStore.shipping)
    const isAuthenticated = computed(() => userStore.isAuthenticated)

    // Watch for changes in cart store shipping method
    watch(
      () => cartStore.shippingMethod,
      (newValue) => {
        shippingMethod.value = newValue
      }
    )

    // Initialize cart on mount
    onMounted(async () => {
      await cartStore.initCart()
    })

    // Format price
    const formatPrice = (price) => {
      return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        minimumFractionDigits: 0
      }).format(price)
    }

    // Cart actions
    const removeFromCart = (index) => {
      cartStore.removeFromCart(index)
    }

    const increaseQuantity = (index) => {
      cartStore.increaseQuantity(index)
    }

    const decreaseQuantity = (index) => {
      cartStore.decreaseQuantity(index)
    }

    const clearCart = () => {
      if (confirm('Opravdu chcete vyprázdnit košík?')) {
        cartStore.clearCart()
      }
    }

    const updateShippingMethod = () => {
      cartStore.setShippingMethod(shippingMethod.value)
    }

    const proceedToCheckout = () => {
      if (isAuthenticated.value) {
        // Proceed to checkout
        router.push('/pokladna')
      } else {
        // Redirect to login with return URL
        router.push({
          path: '/prihlaseni',
          query: { returnUrl: '/pokladna' }
        })
      }
    }

    const initCart = () => {
      cartStore.initCart()
    }

    return {
      items,
      shippingMethod,
      isLoading,
      error,
      cartTotal,
      shipping,
      isAuthenticated,
      formatPrice,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      updateShippingMethod,
      proceedToCheckout,
      initCart
    }
  }
}
</script>

<style scoped>
.cart-page {
  min-height: 70vh;
}

.HeadingStrip {
  width: 100%;
  height: 150px;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
}

h1 {
  color: #0e0e0e;
  margin: 100px auto 80px auto;
  text-align: center;
  font-size: 42px;
}

.cart-container {
  max-width: 1200px;
  margin: 0 auto 80px auto;
  padding: 0 20px;
}

.cart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 0;
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-cart {
  text-align: center;
  padding: 50px 0;
}

.empty-cart-content {
  background-color: #f9f9f9;
  padding: 40px;
  border-radius: 8px;
  max-width: 600px;
  margin: 0 auto;
}

.empty-cart h2 {
  margin-bottom: 20px;
  color: #333;
}

.empty-cart p {
  margin-bottom: 30px;
  color: #666;
}

.continue-shopping {
  display: inline-block;
  background-color: #f5852a;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.continue-shopping:hover {
  background-color: #e67722;
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 30px;
}

.cart-items-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.cart-items-container h2 {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.cart-items {
  margin-bottom: 30px;
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto auto 40px;
  gap: 15px;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.item-image img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
}

.item-name {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #333;
}

.item-price {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.item-quantity {
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quantity-btn:hover {
  background-color: #e6e6e6;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-value {
  width: 30px;
  text-align: center;
  font-weight: 600;
  margin: 0 10px;
}

.item-subtotal {
  font-weight: 600;
  color: #333;
  text-align: right;
  min-width: 100px;
}

.remove-item {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
  padding: 5px;
}

.remove-item:hover {
  color: #e63946;
}

.remove-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 20px;
}

.clear-cart {
  background-color: #f8f8f8;
  color: #666;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.clear-cart:hover {
  background-color: #eee;
}

.clear-cart:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-summary {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  position: sticky;
  top: 20px;
}

.cart-summary h2 {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.summary-row.total {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  font-weight: 700;
  font-size: 18px;
  color: #333;
}

.shipping-options {
  margin-bottom: 20px;
}

.shipping-options h3 {
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.shipping-option {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.shipping-option input[type='radio'] {
  margin-top: 4px;
  margin-right: 10px;
}

.shipping-option label {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.checkout-button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 15px 20px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 20px;
}

.checkout-button:hover {
  background-color: #45a049;
}

.checkout-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-prompt {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
  font-size: 14px;
}

.login-prompt a {
  color: #f5852a;
  text-decoration: underline;
}

.error-message {
  background-color: #fff8f8;
  border: 1px solid #ffdddd;
  color: #e63946;
  padding: 15px;
  border-radius: 5px;
  margin-top: 20px;
  text-align: center;
}

.error-message button {
  margin-top: 10px;
  background-color: #e63946;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.error-message button:hover {
  background-color: #d32f2f;
}

@media (max-width: 992px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-summary {
    position: static;
    margin-top: 30px;
  }
}

@media (max-width: 768px) {
  h1 {
    font-size: 32px;
    margin: 60px auto 40px auto;
  }

  .HeadingStrip {
    height: 120px;
  }

  .cart-item {
    grid-template-columns: 60px 1fr auto;
    grid-template-rows: auto auto;
    gap: 10px;
  }

  .item-image {
    grid-row: span 2;
  }

  .item-details {
    grid-column: 2;
  }

  .item-quantity {
    grid-column: 3;
    grid-row: 1;
  }

  .item-subtotal {
    grid-column: 2;
    grid-row: 2;
    text-align: left;
  }

  .remove-item {
    grid-column: 3;
    grid-row: 2;
    justify-self: end;
  }
}

@media (max-width: 576px) {
  .cart-container {
    padding: 0 15px;
  }

  .cart-items-container,
  .cart-summary {
    padding: 20px 15px;
  }

  h1 {
    font-size: 28px;
    margin: 40px auto 30px auto;
  }

  .HeadingStrip {
    height: 100px;
  }

  .cart-actions {
    flex-direction: column;
    gap: 15px;
  }

  .continue-shopping,
  .clear-cart {
    width: 100%;
    text-align: center;
  }
}
</style>
