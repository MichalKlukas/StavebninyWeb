<template>
  <div class="product-card" @click="navigateToProduct">
    <div class="product-image">
      <img
        :src="product.image || product.imageUrl || '/placeholder.png'"
        :alt="product.name"
        @error="onImageError"
      />
    </div>
    <h3 class="product-name">{{ product.name }}</h3>
    <div class="product-price">
      <span class="price">{{ formatPrice(product) }}</span>
      <span class="price-info">Cena za {{ product.priceUnit || 'kus' }} s DPH</span>
    </div>

    <!-- Button for authenticated users -->
    <button v-if="isAuthenticated" class="add-to-cart-btn" @click.stop="addToCart">
      <svg
        class="cart-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span>Přidat do košíku</span>
    </button>

    <!-- Login message for non-authenticated users -->
    <div v-else class="login-required-message">
      <router-link to="/prihlaseni" class="login-link"> Pro objednání se přihlaste </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import type { PropType } from 'vue'
import { useUserStore } from '@/stores'

export interface Product {
  id: number | string
  name: string
  price: string | number
  image?: string
  imageUrl?: string
  priceUnit?: string
  slug?: string
}

export default defineComponent({
  name: 'ProductCard',
  props: {
    product: {
      type: Object as PropType<Product>,
      required: true
    }
  },
  setup(props, { emit }) {
    const userStore = useUserStore()
    // We'll use a computed to check if user is logged in
    const isAuthenticated = computed(() => userStore.isAuthenticated)

    const addToCart = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()

      if (isAuthenticated.value) {
        // Emit event only if authenticated
        emit('add-to-cart', props.product)
      }
    }

    return {
      userStore,
      isAuthenticated,
      addToCart
    }
  },
  methods: {
    navigateToProduct() {
      // Navigate to product detail page
      const productSlug = this.product.slug || this.product.id
      this.$router.push(`/product/${productSlug}`)
    },
    formatPrice(product: Product): string {
      // If price is already a string with format "XXX Kč/jednotka", return the portion before "Kč/"
      if (typeof product.price === 'string' && product.price.includes('Kč/')) {
        return product.price.split('Kč/')[0] + ' Kč'
      }
      // Otherwise return as is or "XXX Kč"
      return typeof product.price === 'string' ? product.price : `${product.price} Kč`
    },
    onImageError(event: Event) {
      // Type assertion for TypeScript; change to your preferred placeholder path
      ;(event.target as HTMLImageElement).src = '/placeholder.png'
    }
  }
})
</script>

<style scoped>
.product-card {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.product-image {
  margin-bottom: 15px;
  height: 200px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.product-name {
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 10px;
  height: 40px; /* Fixed height for consistent card sizes */
  overflow: hidden;
  display: flex;
  /* Multi-line ellipsis fallback for all browsers */
  max-height: 40px;
  line-height: 20px; /* 2 lines of text */
}

.product-price {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
}

.price {
  font-size: 18px;
  font-weight: 600;
  color: #f5852a;
}

.price-info {
  font-size: 12px;
  color: #666;
}

.add-to-cart-btn {
  background-color: #f5852a;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.add-to-cart-btn:hover {
  background-color: #e67722;
}

.cart-icon {
  width: 16px;
  height: 16px;
  stroke: white;
}

/* New styles for login message */
.login-required-message {
  width: 100%;
  padding: 8px 15px;
  background-color: #f0f0f0;
  border-radius: 4px;
  text-align: center;
}

.login-link {
  color: #f5852a;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.login-link:hover {
  color: #e67722;
  text-decoration: underline;
}
</style>
