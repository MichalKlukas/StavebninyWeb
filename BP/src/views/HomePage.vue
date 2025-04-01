<template>
  <div class="home-page">
    <!-- Hero Banner Section -->
    <div class="hero-banner">
      <img :src="storeFrontImage" alt="Stavebniny prodejna" class="hero-image" />
    </div>

    <!-- Best Selling Products Section -->
    <reusableCarousel
      itemType="product"
      title="Doporučené produkty"
      :items="recommendedProducts"
      :displayCount="6"
      :slideCount="6"
      :autoSlide="true"
      @add-to-cart="handleAddToCart"
      :isAuthenticated="userStore.isAuthenticated"
    />

    <!-- Manufacturers Carousel -->
    <reusableCarousel
      itemType="manufacturer"
      title="Naši výrobci"
      :items="manufacturers"
      :displayCount="6"
      :slideCount="6"
      :autoSlide="true"
    />

    <!-- Notifikace o přidání do košíku -->
    <div class="cart-notification" v-if="showNotification">
      <div class="notification-content">
        <svg
          class="success-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>Produkt byl přidán do košíku</span>
      </div>
      <router-link to="/cart" class="view-cart-btn">Přejít do košíku</router-link>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import reusableCarousel from '@/components/reusableCarousel.vue'
import { useCart } from '@/stores/stavKosiku'
import { useUserStore } from '@/stores'

// Import images directly using ES module imports
import storeFrontImage from '@/assets/store-front.jpg'

// Import manufacturer logos
import ytongLogo from '@/assets/manufacturers/ytong.png'
import dedraLogo from '@/assets/manufacturers/dedra.png'
import knaufLogo from '@/assets/manufacturers/knauf.png'
import primalexLogo from '@/assets/manufacturers/primalex.png'
import baumitLogo from '@/assets/manufacturers/baumit.png'
import bestLogo from '@/assets/manufacturers/best.png'
import sigaLogo from '@/assets/manufacturers/siga.png'
import porfixLogo from '@/assets/manufacturers/porfix.png'
import porothermLogo from '@/assets/manufacturers/porotherm.png'
import horizontLogo from '@/assets/manufacturers/horizont.png'
import rajDrevaLogo from '@/assets/manufacturers/raj_dreva.png'
import ditonLogo from '@/assets/manufacturers/diton.png'
import presbetonLogo from '@/assets/manufacturers/presbeton.png'
import styrotradeLogo from '@/assets/manufacturers/styrotrade.png'
import bmiBramcaLogo from '@/assets/manufacturers/bramac.png'

export default {
  name: 'HomePage',
  components: {
    ProductCard,
    reusableCarousel
  },
  setup() {
    // Použijeme náš hook pro košík a uživatele
    const cart = useCart()
    const userStore = useUserStore()
    const showNotification = ref(false)

    // Watch for changes to cart.addSuccess
    watch(
      () => cart.addSuccess,
      (newValue) => {
        if (newValue) {
          showNotification.value = true
          // Notification will be auto-hidden by the timer in the cart store
          setTimeout(() => {
            showNotification.value = false
          }, 3000)
        }
      }
    )

    // Metoda pro přidání produktu do košíku
    const handleAddToCart = async (product) => {
      // Only proceed if user is authenticated
      if (!userStore.isAuthenticated) {
        return
      }

      // Formátování produktu pro košík, pokud je třeba
      const cartProduct = {
        id: product.id,
        name: product.name,
        price:
          typeof product.price === 'string' && product.price.includes('Kč/')
            ? product.price.split('Kč/')[0].trim()
            : product.price,
        image: product.image || product.imageUrl || '/placeholder.png',
        priceUnit: product.priceUnit || 'kus'
      }

      // Přidání produktu do košíku a show notification only on success
      const success = await cart.addToCart(cartProduct)
      if (success) {
        showNotification.value = true
        setTimeout(() => {
          showNotification.value = false
        }, 3000)
      }

      console.log('Přidáno do košíku:', cartProduct)
    }

    return {
      handleAddToCart,
      showNotification,
      userStore
    }
  },
  data() {
    return {
      storeFrontImage,
      // Array of specific product IDs to fetch from the database
      featuredProductIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Replace with your chosen product IDs
      // This will store our fetched products
      recommendedProducts: [],
      manufacturers: [
        {
          id: 1,
          name: 'YTONG',
          imageUrl: ytongLogo
        },
        {
          id: 2,
          name: 'DEDRA',
          imageUrl: dedraLogo
        },
        {
          id: 3,
          name: 'KNAUF',
          imageUrl: knaufLogo
        },
        {
          id: 4,
          name: 'PRIMALEX',
          imageUrl: primalexLogo
        },
        {
          id: 5,
          name: 'BAUMIT',
          imageUrl: baumitLogo
        },
        {
          id: 6,
          name: 'BEST',
          imageUrl: bestLogo
        },
        {
          id: 7,
          name: 'SIGA',
          imageUrl: sigaLogo
        },
        {
          id: 8,
          name: 'PORFIX',
          imageUrl: porfixLogo
        },
        {
          id: 9,
          name: 'POROTHERM',
          imageUrl: porothermLogo
        },
        {
          id: 10,
          name: 'HORIZONT',
          imageUrl: horizontLogo
        },
        {
          id: 11,
          name: 'RAJ DREVA',
          imageUrl: rajDrevaLogo
        },
        {
          id: 12,
          name: 'DITON',
          imageUrl: ditonLogo
        },
        {
          id: 13,
          name: 'PRESBETON',
          imageUrl: presbetonLogo
        },
        {
          id: 14,
          name: 'STYROTRADE',
          imageUrl: styrotradeLogo
        },
        {
          id: 15,
          name: 'BMI BRAMAC',
          imageUrl: bmiBramcaLogo
        }
      ]
    }
  },
  methods: {
    // Fetch products from the API based on specific product IDs
    async fetchRecommendedProducts() {
      try {
        console.log('Fetching featured products')

        // List of specific product IDs you want to feature
        // You can change these IDs to any products you prefer
        const featuredProductIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        const products = []

        // Fetch the specific products by ID
        for (const id of featuredProductIds) {
          try {
            const response = await fetch(`/api/products/${id}`)

            if (response.ok) {
              const result = await response.json()
              if (result.data && result.data.product) {
                products.push(result.data.product)
              }
            }
          } catch (error) {
            console.error(`Error fetching product ${id}:`, error)
          }
        }

        // If we got at least some products, format them for the carousel
        if (products.length > 0) {
          this.recommendedProducts = products.map((product) => ({
            id: product.id,
            name: product.name,
            imageUrl: product.image_url || '/placeholder.png',
            price: parseFloat(product.price).toFixed(2).replace('.', ',') + ' Kč',
            price_unit: product.jednotka || 'ks'
          }))

          console.log('Fetched featured products:', this.recommendedProducts)
        } else {
          // If no products found by ID, fetch random products as fallback
          console.log('No products found by ID, fetching random products')
          const randomResponse = await fetch('/api/products?limit=12')

          if (randomResponse.ok) {
            const result = await randomResponse.json()

            if (result.data && result.data.products && result.data.products.length > 0) {
              this.recommendedProducts = result.data.products.map((product) => ({
                id: product.id,
                name: product.name,
                imageUrl: product.image_url
                  ? `http://46.28.108.195/images/produkty/${product.image_url}`
                  : '/placeholder-image.jpg',
                price: parseFloat(product.price).toFixed(2).replace('.', ',') + ' Kč',
                price_unit: product.jednotka || 'ks'
              }))
            }
          }
        }
      } catch (error) {
        console.error('Error fetching recommended products:', error)
        // Use fallback data if needed
        this.useDefaultProducts()
      }
    },

    // Fallback method to use default products
    useDefaultProducts() {
      console.log('Using default product data')
      // Define some default products if API fails
      const defaultProducts = [
        {
          id: 1,
          name: 'Lepidlo Weber 700, 25kg',
          price: '250,47',
          priceUnit: 'balení'
        },
        {
          id: 2,
          name: 'Sádrokartonová deska Knauf 12,5x1250x2000 mm',
          price: '189,90',
          priceUnit: 'kus'
        },
        {
          id: 3,
          name: 'Ytong P2-500 300x249x599 mm',
          price: '93,50',
          priceUnit: 'kus'
        },
        {
          id: 4,
          name: 'Baumit Baumacol FlexUni, 25kg',
          price: '275,60',
          priceUnit: 'balení'
        },
        {
          id: 5,
          name: 'Primalex Plus Bílý, 15kg',
          price: '329,00',
          priceUnit: 'kus'
        },
        {
          id: 6,
          name: 'Cement Portland CEM I 42,5R, 25kg',
          price: '125,00',
          priceUnit: 'balení'
        }
      ]

      // Transform to expected format
      this.recommendedProducts = defaultProducts.map((product) => ({
        id: product.id,
        name: product.name,
        imageUrl: '/placeholder.png',
        price: `${product.price} Kč/${product.priceUnit}`,
        priceUnit: product.priceUnit
      }))
    }
  },
  created() {
    // Fetch products from API
    this.fetchRecommendedProducts()
  }
}
</script>

<style scoped>
.home-page {
  width: 100%;
}

.hero-banner {
  width: 100%;
  height: 400px;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 15px 20px;
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.success-icon {
  width: 20px;
  height: 20px;
  stroke: #4caf50;
}

.view-cart-btn {
  margin-left: 20px;
  color: #f5852a;
  text-decoration: none;
  font-weight: 500;
}

.view-cart-btn:hover {
  text-decoration: underline;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .hero-banner {
    height: 300px;
  }

  .cart-notification {
    left: 20px;
    right: 20px;
    flex-direction: column;
    align-items: flex-start;
  }

  .view-cart-btn {
    margin-left: 0;
    margin-top: 10px;
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .hero-banner {
    height: 200px;
  }
}
</style>
