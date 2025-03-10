<template>
  <div class="carousel-section">
    <h2 class="section-title">{{ title }}</h2>
    <div class="carousel-container">
      <div class="items-container">
        <div class="items-wrapper">
          <transition-group name="carousel-slide">
            <div
              v-for="item in visibleItems"
              :key="item.id"
              class="carousel-item"
              :class="{ 'product-item': itemType === 'product' }"
            >
              <img :src="item.imageUrl" :alt="item.name" />
              <div class="item-details">
                <p class="item-name">{{ item.name }}</p>
                <p v-if="itemType === 'product'" class="item-price">{{ item.price }}</p>
                <!-- Tlačítko Přidat do košíku pouze pro produkty -->
                <button
                  v-if="itemType === 'product'"
                  class="add-to-cart-btn"
                  @click.stop="addToCart(item)"
                >
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
                    <path
                      d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                    ></path>
                  </svg>
                  <span>Přidat do košíku</span>
                </button>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReusableCarousel',
  props: {
    // Type of items to display: 'manufacturer' or 'product'
    itemType: {
      type: String,
      default: 'manufacturer',
      validator: (value) => ['manufacturer', 'product'].includes(value)
    },
    // Title to display above the carousel
    title: {
      type: String,
      required: true
    },
    // Items to display in the carousel
    items: {
      type: Array,
      required: true
    },
    // Number of items to display at once
    displayCount: {
      type: Number,
      default: 6
    },
    // Number of items to move when sliding
    slideCount: {
      type: Number,
      default: 6
    },
    // Time in milliseconds between automatic slides
    autoSlideInterval: {
      type: Number,
      default: 6000
    },
    // Whether to enable automatic sliding
    autoSlide: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      currentIndex: 0,
      autoSlideTimer: null
    }
  },
  computed: {
    visibleItems() {
      return this.items.slice(this.currentIndex, this.currentIndex + this.displayCount)
    },
    isFirstSlide() {
      return this.currentIndex === 0
    },
    isLastSlide() {
      return this.currentIndex >= this.items.length - this.displayCount
    },
    effectiveAutoSlideInterval() {
      // Use the prop value, but if it's a product carousel, use 12 seconds instead of the default
      return this.itemType === 'product' ? 12000 : 6000
    }
  },
  watch: {
    // Reset currentIndex when items change
    items() {
      this.currentIndex = 0
      this.resetAutoSlide()
    }
  },
  mounted() {
    if (this.autoSlide) {
      this.startAutoSlide()
    }
  },
  beforeUnmount() {
    this.stopAutoSlide()
  },
  methods: {
    slideNext() {
      if (!this.isLastSlide) {
        this.currentIndex = Math.min(
          this.items.length - this.displayCount,
          this.currentIndex + this.slideCount
        )
      } else {
        // Loop back to the beginning
        this.currentIndex = 0
      }
    },
    startAutoSlide() {
      this.stopAutoSlide() // Clear any existing timer
      this.autoSlideTimer = setInterval(() => {
        this.slideNext()
      }, this.effectiveAutoSlideInterval)
    },
    stopAutoSlide() {
      if (this.autoSlideTimer) {
        clearInterval(this.autoSlideTimer)
        this.autoSlideTimer = null
      }
    },
    resetAutoSlide() {
      if (this.autoSlide) {
        this.stopAutoSlide()
        this.startAutoSlide()
      }
    },
    // Nová metoda pro přidání do košíku
    addToCart(item) {
      // Zastavíme automatické posouvání při interakci
      this.stopAutoSlide()

      // Emitujeme událost nahoru k rodičovské komponentě
      this.$emit('add-to-cart', item)

      // Obnovíme automatické posouvání po krátké pauze
      setTimeout(() => {
        this.resetAutoSlide()
      }, 1000)
    }
  }
}
</script>

<style scoped>
.carousel-section {
  padding: 40px 20px;
  margin: 40px 0;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 28px;
  color: #333;
}

.carousel-container {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.items-container {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.items-wrapper {
  display: flex;
  width: 100%;
  min-height: 150px;
}

.carousel-item {
  flex: 0 0 calc(100% / 6);
  width: calc(100% / 6);
  padding: 10px;
  text-align: center;
  box-sizing: border-box;
}

.carousel-item img {
  max-width: 100%;
  max-height: 80px;
  object-fit: contain;
  margin-bottom: 10px;
  transition: transform 0.3s ease;
}

.carousel-item:hover img {
  transform: scale(1.05);
}

.item-name {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Product-specific styling */
.product-item {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 15px;
  transition: box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.product-item:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.product-item img {
  max-height: 120px;
  margin-bottom: 15px;
}

.item-price {
  font-weight: bold;
  color: #f5852a;
  margin-top: 5px;
  margin-bottom: 10px;
}

.add-to-cart-btn {
  background-color: #f5852a;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 10px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.add-to-cart-btn:hover {
  background-color: #e67722;
}

.cart-icon {
  width: 16px;
  height: 16px;
  stroke: white;
}

/* Improved transition for the carousel */
.carousel-slide-enter-active,
.carousel-slide-leave-active {
  transition: all 0.3s ease-out;
}

.carousel-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.carousel-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.carousel-slide-move {
  transition: transform 0.3s ease-out;
}

/* Responsive styling */
@media (max-width: 1024px) {
  .carousel-item {
    flex: 0 0 calc(100% / 4);
    width: calc(100% / 4);
  }
}

@media (max-width: 768px) {
  .carousel-item {
    flex: 0 0 calc(100% / 3);
    width: calc(100% / 3);
  }

  .add-to-cart-btn {
    padding: 6px 8px;
    font-size: 12px;
  }

  .cart-icon {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 480px) {
  .carousel-item {
    flex: 0 0 calc(100% / 2);
    width: calc(100% / 2);
  }

  .add-to-cart-btn span {
    display: none;
  }

  .cart-icon {
    margin: 0;
  }
}
</style>
