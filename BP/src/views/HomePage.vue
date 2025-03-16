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

<script lang="ts">
import { defineComponent, ref } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import reusableCarousel from '@/components/reusableCarousel.vue'
import type { Product } from '@/components/ProductCard.vue'
import { useCart } from '@/stores/stavKosiku.js'

// Import images directly using ES module imports
import storeFrontImage from '@/assets/store-front.jpg'
import weber700Image from '@/assets/weber.jpg'

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

export default defineComponent({
  name: 'HomePage',
  components: {
    ProductCard,
    reusableCarousel
  },
  setup() {
    // Použijeme náš hook pro košík
    const cart = useCart()
    const showNotification = ref(false)

    // Metoda pro přidání produktu do košíku
    const handleAddToCart = (product: any) => {
      // Formátování produktu pro košík, pokud je třeba
      const cartProduct = {
        id: product.id,
        name: product.name,
        price:
          typeof product.price === 'string' && product.price.includes('Kč/')
            ? product.price.split('Kč/')[0].trim()
            : product.price,
        image: product.image || product.imageUrl || '/placeholder.jpg',
        priceUnit: product.priceUnit || 'kus'
      }

      // Přidání produktu do košíku
      cart.addToCart(cartProduct)

      // Zobrazení notifikace
      showNotification.value = true

      // Skrytí notifikace po 3 sekundách
      setTimeout(() => {
        showNotification.value = false
      }, 3000)

      console.log('Přidáno do košíku:', cartProduct)
    }

    return {
      handleAddToCart,
      showNotification
    }
  },
  data() {
    return {
      storeFrontImage,
      bestSellingProducts: [
        {
          id: 1,
          name: 'Lepidlo Weber 700, 25kg',
          price: '250,47',
          image: weber700Image,
          priceUnit: 'balení'
        },
        {
          id: 2,
          name: 'Sádrokartonová deska Knauf 12,5x1250x2000 mm',
          price: '189,90',
          image: '/placeholder.jpg',
          priceUnit: 'kus'
        },
        {
          id: 3,
          name: 'Ytong P2-500 300x249x599 mm',
          price: '93,50',
          image: '/placeholder.jpg',
          priceUnit: 'kus'
        },
        {
          id: 4,
          name: 'Baumit Baumacol FlexUni, 25kg',
          price: '275,60',
          image: '/placeholder.jpg',
          priceUnit: 'balení'
        },
        {
          id: 5,
          name: 'Primalex Plus Bílý, 15kg',
          price: '329,00',
          image: '/placeholder.jpg',
          priceUnit: 'kus'
        },
        {
          id: 6,
          name: 'Cement Portland CEM I 42,5R, 25kg',
          price: '125,00',
          image: '/placeholder.jpg',
          priceUnit: 'balení'
        },
        {
          id: 7,
          name: 'Isover EPS 70F Fasádní polystyren, 100mm',
          price: '189,00',
          image: '/placeholder.jpg',
          priceUnit: 'deska'
        },
        {
          id: 8,
          name: 'Porotherm 44 P+D, 248x440x238 mm',
          price: '64,50',
          image: '/placeholder.jpg',
          priceUnit: 'kus'
        },
        {
          id: 9,
          name: 'Fasádní barva Baumit StarColor, 25kg',
          price: '1450,00',
          image: '/placeholder.jpg',
          priceUnit: 'kbelík'
        },
        {
          id: 10,
          name: 'BEST Zámková dlažba BEATON, 6cm šedá',
          price: '279,00',
          image: '/placeholder.jpg',
          priceUnit: 'm²'
        },
        {
          id: 11,
          name: 'BEST Zámková dlažba BEATON, 6cm šedá',
          price: '279,00',
          image: '/placeholder.jpg',
          priceUnit: 'm²'
        },
        {
          id: 12,
          name: 'BEST Zámková dlažba BEATON, 6cm šedá',
          price: '279,00',
          image: '/placeholder.jpg',
          priceUnit: 'm²'
        }
      ] as Product[],
      // Transformed data for reusableCarousel
      recommendedProducts: [] as any[],
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
        }
      ]
    }
  },
  created() {
    // Transform bestSellingProducts to match the format needed by reusableCarousel
    this.recommendedProducts = this.bestSellingProducts.map((product) => ({
      id: product.id,
      name: product.name,
      imageUrl: product.image,
      price: product.price + ' Kč/' + product.priceUnit,
      priceUnit: product.priceUnit
    }))
  }
})
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
