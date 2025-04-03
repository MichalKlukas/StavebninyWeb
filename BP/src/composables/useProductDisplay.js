// src/composables/useProductDisplay.js
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '@/stores/stavKosiku'
import { useUserStore } from '@/stores'

export function useProductDisplay() {
  const cart = useCart()
  const userStore = useUserStore()
  const router = useRouter()

  // Shared state
  const allProducts = ref([])
  const filteredProducts = ref([])
  const isLoading = ref(true)
  const currentPage = ref(1)
  const itemsPerPage = 15
  const showSidebar = ref(false)
  const showNotification = ref(false)
  const sortOption = ref('name-asc')

  // Filters
  const filters = ref({
    price: {
      isOpen: true,
      min: null,
      max: null
    }
  })

  // Computed properties
  const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage))

  const paginatedProducts = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage
    return filteredProducts.value.slice(startIndex, startIndex + itemsPerPage)
  })

  // Methods
  const filterProducts = () => {
    let result = [...allProducts.value]

    // Filter by price
    if (filters.value.price.min) {
      result = result.filter((product) => product.price >= filters.value.price.min)
    }

    if (filters.value.price.max) {
      result = result.filter((product) => product.price <= filters.value.price.max)
    }

    // Sort products
    sortProductsList(result)

    filteredProducts.value = result
    currentPage.value = 1
  }

  const sortProducts = () => {
    sortProductsList(filteredProducts.value)
  }

  const sortProductsList = (products) => {
    switch (sortOption.value) {
      case 'name-asc':
        products.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        products.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'price-asc':
        products.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        products.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        products.sort((a, b) => b.id - a.id)
        break
    }
  }

  const resetFilters = () => {
    filters.value.price.min = null
    filters.value.price.max = null
    filterProducts()
  }

  const applyPriceFilter = () => {
    filterProducts()
  }

  const toggleFilter = (filterName) => {
    filters.value[filterName].isOpen = !filters.value[filterName].isOpen
  }

  const formatPrice = (price) => {
    const formattedPrice = parseFloat(price).toFixed(2)
    return formattedPrice.replace('.', ',') + ' Kč'
  }

  const viewProductDetail = (productId) => {
    router.push(`/produkt/${productId}`)
  }

  const addToCart = async (product) => {
    if (!userStore.isAuthenticated) {
      return
    }

    const cartProduct = {
      id: product.id,
      name: product.name,
      price: typeof product.price === 'number' ? product.price.toString() : product.price,
      image: product.image || '/placeholder.png',
      priceUnit: 'kus'
    }

    const success = await cart.addToCart(cartProduct)

    if (success) {
      showNotification.value = true
      setTimeout(() => {
        showNotification.value = false
      }, 3000)
    }
  }

  return {
    // State
    allProducts,
    filteredProducts,
    isLoading,
    currentPage,
    totalPages,
    paginatedProducts,
    filters,
    showSidebar,
    sortOption,
    showNotification,
    userStore,

    // Methods
    filterProducts,
    sortProducts,
    resetFilters,
    applyPriceFilter,
    toggleFilter,
    formatPrice,
    viewProductDetail,
    addToCart
  }
}
