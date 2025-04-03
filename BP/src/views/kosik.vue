<template>
  <div class="HeadingStrip">
    <h1>Nákupní košík</h1>
  </div>
  <div class="cart-container">
    <div v-if="cartItems.length > 0">
      <div class="cart-content">
        <div class="cart-items">
          <div class="cart-header">
            <div class="header-product">Produkt</div>
            <div class="header-price">Cena za jednotku</div>
            <div class="header-quantity">Množství</div>
            <div class="header-total">Celkem</div>
            <div class="header-actions"></div>
          </div>

          <div v-for="(item, index) in cartItems" :key="index" class="cart-item">
            <div class="item-product">
              <img
                ::src="item.image ? (item.image.startsWith('http') ? item.image : `http://46.28.108.195/images/produkty/${item.image}`) : '/placeholder-image.jpg'"
                :alt="item.name"
                class="item-image"
              />
              <div class="item-details">
                <h3 class="item-name">{{ item.name }}</h3>
                <p class="item-unit">Jednotka: {{ item.priceUnit || 'kus' }}</p>
              </div>
            </div>
            <div class="item-price">{{ formatPrice(item.price) }}</div>
            <div class="item-quantity">
              <button @click="decreaseQuantity(index)" class="quantity-btn">-</button>
              <input
                type="number"
                v-model.number="item.quantity"
                min="1"
                @change="updateCartItem(index)"
                class="quantity-input"
              />
              <button @click="increaseQuantity(index)" class="quantity-btn">+</button>
            </div>
            <div class="item-total">
              {{ formatPrice(parseFloat(item.price) * item.quantity) }}
            </div>
            <div class="item-actions">
              <button @click="removeFromCart(index)" class="remove-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  ></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="cart-summary">
          <h2>Shrnutí objednávky</h2>
          <div class="summary-row">
            <span>Mezisoučet:</span>
            <span>{{ formatPrice(cartTotal) }}</span>
          </div>
          <div class="summary-row">
            <span>DPH (21%):</span>
            <span>{{ formatPrice(cartTotal * 0.21) }}</span>
          </div>
          <div class="summary-row shipping">
            <span>Doprava:</span>
            <span v-if="selectedShippingMethod === 'delivery'" class="fee">Poplatek</span>
            <span v-else class="free-shipping">Zdarma</span>
          </div>
          <div class="summary-row total">
            <span>Celková cena:</span>
            <span>{{ formatPrice(cartTotal) }}</span>
          </div>

          <div class="shipping-options">
            <h3>Způsob dopravy</h3>
            <div class="option-wrapper">
              <input
                type="radio"
                id="pickup"
                name="shipping"
                value="pickup"
                v-model="selectedShippingMethod"
              />
              <label for="pickup">Osobní odběr</label>
            </div>
            <div class="option-wrapper">
              <input
                type="radio"
                id="delivery"
                name="shipping"
                value="delivery"
                v-model="selectedShippingMethod"
              />
              <label for="delivery">Doručení na adresu</label>
            </div>
          </div>

          <button @click="proceedToCheckout" class="checkout-btn">Potvrdit objednávku</button>
          <button @click="continueShopping" class="continue-shopping-btn">
            Pokračovat v nákupu
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-cart">
      <svg
        class="empty-cart-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <h2>Váš košík je prázdný</h2>
      <p>Vypadá to, že jste do košíku ještě nic nepřidali.</p>
      <button @click="continueShopping" class="continue-shopping-btn">Přejít do obchodu</button>
    </div>
  </div>
</template>

<script>
import { useCart } from '@/stores/stavKosiku'
import { computed, ref, watch, onMounted } from 'vue'

export default {
  name: 'CartView',
  setup() {
    const cart = useCart()

    // Create a computed property for cart items to make it reactive
    const cartItems = computed(() => cart.items)

    // Create a computed property for total to ensure it updates
    const cartTotal = computed(() => cart.cartTotal)

    // This local ref is optional; you can also just bind directly to cart.shippingMethod
    const selectedShippingMethod = ref(cart.shippingMethod)

    // Fetch the cart data when component mounts
    onMounted(() => {
      cart.fetchCart()
    })

    // Watch for changes from the store
    watch(
      () => cart.shippingMethod,
      (newVal) => {
        selectedShippingMethod.value = newVal
      }
    )

    // If the user changes the local shipping method
    watch(selectedShippingMethod, (newVal) => {
      cart.setShippingMethod(newVal)
    })

    const currentShippingCost = computed(() => {
      // Only return a cost in the calculations, but don't display the specific amount in the UI
      return selectedShippingMethod.value === 'delivery' ? 0 : 0
    })

    // Example for updating item quantity
    const updateCartItem = (index) => {
      const item = cartItems.value[index]
      cart.updateQuantity(index, item.quantity)
    }

    // Helper functions for increasing/decreasing quantity
    const increaseQuantity = (index) => {
      const item = cartItems.value[index]
      cart.updateQuantity(index, item.quantity + 1)
    }

    const decreaseQuantity = (index) => {
      const item = cartItems.value[index]
      if (item.quantity > 1) {
        cart.updateQuantity(index, item.quantity - 1)
      }
    }

    // Format price
    const formatPrice = (price) => {
      // Handle string prices with commas
      if (typeof price === 'string') {
        price = parseFloat(price.replace(',', '.'))
      }

      return (
        price.toLocaleString('cs-CZ', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kč'
      )
    }

    return {
      cartItems,
      cartTotal,
      currentShippingCost,
      selectedShippingMethod,
      removeFromCart: cart.removeFromCart,
      updateCartItem,
      increaseQuantity,
      decreaseQuantity,
      formatPrice
    }
  },
  methods: {
    proceedToCheckout() {
      this.$router.push('/potvrzeni-objednavky')
    },
    continueShopping() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
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
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.cart-content {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.cart-items {
  flex: 1 1 65%;
  min-width: 300px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.cart-header {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 0.5fr;
  padding: 15px;
  background-color: #f9f9f9;
  font-weight: 600;
  border-bottom: 1px solid #eee;
}

.cart-item {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 0.5fr;
  padding: 15px;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.item-product {
  display: flex;
  align-items: center;
  gap: 15px;
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.item-name {
  font-size: 16px;
  margin: 0 0 5px 0;
}

.item-unit {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.item-quantity {
  display: flex;
  align-items: center;
}

.quantity-input {
  width: 40px;
  text-align: center;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 0;
}

.quantity-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.quantity-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.quantity-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.item-total {
  font-weight: 600;
}

.remove-btn {
  background: none;
  border: none;
  color: #e63946;
  cursor: pointer;
  padding: 5px;
}

.remove-btn svg {
  width: 18px;
  height: 18px;
  stroke: #e63946;
}

.cart-summary {
  flex: 1 1 30%;
  min-width: 250px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  position: sticky;
  top: 20px;
  align-self: flex-start;
}

.cart-summary h2 {
  font-size: 24px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 16px;
}

.shipping {
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.free-shipping {
  color: #4caf50;
  font-weight: 500;
}

.fee {
  color: #f5852a;
  font-weight: 500;
}

.total {
  font-weight: 700;
  font-size: 18px;
  margin-top: 15px;
  color: #f5852a;
}

.shipping-options,
.discount-code {
  margin: 25px 0;
}

.shipping-options h3,
.discount-code h3 {
  font-size: 18px;
  margin-bottom: 15px;
}

.option-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.option-wrapper input[type='radio'] {
  margin-right: 10px;
}

.discount-input-wrapper {
  display: flex;
  margin-bottom: 10px;
}

.discount-input-wrapper input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
}

.apply-btn {
  background: #333;
  color: white;
  border: none;
  padding: 0 15px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.discount-message {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.checkout-btn {
  background-color: #f5852a;
  color: white;
  border: none;
  padding: 15px;
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
  transition: background-color 0.3s;
}

.checkout-btn:hover {
  background-color: #e67722;
}

.continue-shopping-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 10px;
  width: 100%;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.continue-shopping-btn:hover {
  background-color: #f9f9f9;
}

.empty-cart {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-cart-icon {
  width: 80px;
  height: 80px;
  stroke: #ccc;
  margin-bottom: 20px;
}

.empty-cart h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.empty-cart p {
  color: #666;
  margin-bottom: 30px;
}

.empty-cart .continue-shopping-btn {
  display: inline-block;
  width: auto;
  padding: 12px 25px;
  background-color: #f5852a;
  color: white;
  border: none;
}

.empty-cart .continue-shopping-btn:hover {
  background-color: #e67722;
}

@media (max-width: 768px) {
  h1 {
    font-size: 32px;
    margin: 60px auto 40px auto;
  }

  .HeadingStrip {
    height: 120px;
  }

  .cart-header {
    display: none;
  }

  .cart-item {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 10px;
    padding: 15px;
  }

  .item-product {
    grid-column: 1;
    grid-row: 1;
  }

  .item-price,
  .item-quantity {
    grid-column: 1;
    grid-row: 2;
    justify-content: space-between;
    align-items: center;
  }

  .item-price {
    grid-column: 1;
    grid-row: 2;
    justify-content: flex-start;
  }

  .item-quantity {
    grid-column: 1;
    grid-row: 2;
    justify-content: flex-end;
  }

  .item-total,
  .item-actions {
    grid-column: 1;
    grid-row: 3;
    display: flex;
  }

  .item-total {
    justify-content: flex-start;
  }

  .item-actions {
    justify-content: flex-end;
  }
}

@media (max-width: 576px) {
  .cart-container {
    padding: 10px;
  }
}
</style>
