// src/stores/stavKosiku.js
import { reactive, computed, watch } from 'vue'
import axios from 'axios'
import { useUserStore } from './index'

// API baseURL - make sure to add /api to all endpoints
const BASE_URL = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'
const API_URL = `${BASE_URL}/api`

// Helper function to parse price strings correctly
const parsePrice = (priceString) => {
  if (typeof priceString === 'number') return priceString

  // Handle Czech/European price format (e.g., "329,00 Kč")
  if (typeof priceString === 'string') {
    // Remove currency symbol and spaces
    let cleanPrice = priceString.replace(/[^\d,\.]/g, '')
    // Replace comma with dot for decimal
    cleanPrice = cleanPrice.replace(',', '.')
    // Parse to float
    return parseFloat(cleanPrice) || 0
  }

  return 0
}

// Reaktivní stav košíku
const state = reactive({
  items: [],
  shippingMethod: 'pickup', // Nastavíme výchozí metodu na osobní odběr (zdarma)
  loading: false,
  error: null,
  initialized: false
})

// Inicializace košíku
const initializeCart = async () => {
  if (state.initialized) return
  state.initialized = true

  const userStore = useUserStore()

  try {
    state.loading = true

    // Always load from localStorage first
    loadLocalCart()
    console.log('Local cart loaded')

    // Then, if user is authenticated, try to load from server
    if (userStore.isAuthenticated) {
      console.log('User is authenticated, checking cart API status...')
      try {
        // First try to access the status endpoint without auth
        await axios
          .get(`${API_URL}/cart/status`)
          .then((response) => {
            console.log('Cart API status check successful:', response.data)
            if (response.data.success) {
              return loadServerCart()
            }
          })
          .catch((error) => {
            console.error('Cart API status check failed:', error)
            // Continue with local cart
          })
      } catch (error) {
        console.error('Error checking cart API status:', error)
        // Continue with local cart
      }
    } else {
      console.log('User not authenticated, using local cart only')
    }

    state.loading = false
  } catch (error) {
    console.error('Error initializing cart:', error)
    state.error = 'Nepodařilo se načíst košík'
    state.loading = false
  }
}

// Načtení košíku z localStorage
const loadLocalCart = () => {
  try {
    const savedCart = localStorage.getItem('kosik')
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      state.items = parsedCart.items || []
      state.shippingMethod = parsedCart.shippingMethod || 'pickup'
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error)
    state.error = 'Nepodařilo se načíst košík z lokálního úložiště'

    // Reset košíku při chybě
    state.items = []
    state.shippingMethod = 'pickup'
  }
}

// Načtení košíku ze serveru
const loadServerCart = async () => {
  const userStore = useUserStore()

  if (!userStore.isAuthenticated || !userStore.token) {
    console.log('User not authenticated, skipping server cart load')
    return
  }

  try {
    // Získání košíku ze serveru
    const response = await axios.get(`${API_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    })

    if (response.data.success) {
      // Mapování dat z databáze do formátu košíku
      state.items = response.data.cartItems.map((item) => ({
        id: item.product_id,
        quantity: item.quantity,
        dbId: item.id, // ID záznamu v databázi pro pozdější použití
        // Poznámka: V tomto okamžiku nemáme detaily produktu jako název, cena, atd.
        // Tyto údaje by musely být získány z databáze nebo z API produktů
        name: item.name || 'Produktové ID: ' + item.product_id,
        price: item.price || '0',
        image: item.image || '/placeholder.jpg',
        priceUnit: item.price_unit || 'kus'
      }))

      // Získání uživatelského nastavení dopravy
      try {
        const prefsResponse = await axios.get(`${API_URL}/user/preferences/shipping`, {
          headers: {
            Authorization: `Bearer ${userStore.token}`
          }
        })

        if (prefsResponse.data.success) {
          state.shippingMethod = prefsResponse.data.shippingMethod
        }
      } catch (prefsError) {
        console.error('Error loading shipping preferences:', prefsError)
        // Continue without updating shipping preferences
      }
    }
  } catch (error) {
    // If the error is 401 Unauthorized, it means the token is invalid or expired
    if (error.response && error.response.status === 401) {
      // Token might be expired, log the user out
      console.error('Authentication token invalid or expired')
      userStore.logout()
    }

    console.error('Error loading cart from server:', error)
    throw error
  }
}

// Uložení košíku
const saveCart = async () => {
  const userStore = useUserStore()

  try {
    if (userStore.isAuthenticated) {
      // Košík již je synchronizován se serverem pomocí jednotlivých API volání
    } else {
      // Uložení do localStorage pro nepřihlášené uživatele
      localStorage.setItem(
        'kosik',
        JSON.stringify({
          items: state.items,
          shippingMethod: state.shippingMethod
        })
      )
    }
  } catch (error) {
    console.error('Error saving cart:', error)
    state.error = 'Nepodařilo se uložit košík'
  }
}

// Synchronizace lokálního košíku se serverem při přihlášení
const syncCartWithServer = async () => {
  const userStore = useUserStore()

  if (!userStore.isAuthenticated) return

  try {
    state.loading = true

    // Získání lokálního košíku
    const localItems = state.items

    // Odeslání lokálních položek na server
    await axios.post(
      `${API_URL}/cart/sync`,
      { items: localItems },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      }
    )

    // Načtení aktualizovaného košíku ze serveru
    await loadServerCart()

    // Vymazání lokálního košíku
    localStorage.removeItem('kosik')

    state.loading = false
  } catch (error) {
    console.error('Error syncing cart with server:', error)
    state.error = 'Nepodařilo se synchronizovat košík se serverem'
    state.loading = false
  }
}

// Main store export
export const useCart = () => {
  const userStore = useUserStore()

  // Inicializace při prvním volání
  if (!state.initialized) {
    initializeCart()
  }

  // Sledování změny přihlášení
  watch(
    () => userStore.isAuthenticated,
    async (isAuthenticated, wasAuthenticated) => {
      // Pokud se uživatel přihlásil
      if (isAuthenticated && !wasAuthenticated) {
        await syncCartWithServer()
      }
      // Pokud se uživatel odhlásil, načteme lokální košík
      else if (!isAuthenticated && wasAuthenticated) {
        loadLocalCart()
      }
    }
  )

  // Přidání produktu do košíku
  const addToCart = async (product) => {
    try {
      state.loading = true

      // Process price to ensure it's in the correct format
      const processedProduct = {
        ...product,
        price: parsePrice(product.price)
      }

      // Kontrola, zda produkt již je v košíku
      const existingIndex = state.items.findIndex((item) => item.id === processedProduct.id)

      if (userStore.isAuthenticated) {
        // API volání pro přidání do košíku
        const response = await axios.post(
          `${API_URL}/cart`,
          {
            productId: processedProduct.id,
            quantity: 1,
            price: processedProduct.price,
            name: processedProduct.name,
            image: processedProduct.image || '/placeholder.jpg',
            priceUnit: processedProduct.priceUnit || 'kus'
          },
          {
            headers: {
              Authorization: `Bearer ${userStore.token}`
            }
          }
        )

        if (response.data.success) {
          // Pokud je položka již v košíku, aktualizujeme ji
          if (existingIndex !== -1) {
            state.items[existingIndex].quantity++
            state.items[existingIndex].dbId = response.data.cartItem.id
          } else {
            // Přidání nového produktu
            state.items.push({
              id: processedProduct.id,
              name: processedProduct.name,
              price: processedProduct.price,
              image: processedProduct.image || '/placeholder.jpg',
              priceUnit: processedProduct.priceUnit || 'kus',
              quantity: 1,
              dbId: response.data.cartItem.id
            })
          }
        }
      } else {
        // Pro nepřihlášeného uživatele používáme lokální košík
        if (existingIndex !== -1) {
          state.items[existingIndex].quantity++
        } else {
          state.items.push({
            ...processedProduct,
            quantity: 1,
            image: processedProduct.image || '/placeholder.jpg',
            priceUnit: processedProduct.priceUnit || 'kus'
          })
        }

        // Uložení do localStorage
        saveCart()
      }

      state.loading = false
    } catch (error) {
      console.error('Error adding to cart:', error)
      state.error = 'Nepodařilo se přidat položku do košíku'
      state.loading = false
    }
  }

  // Odstranění položky z košíku
  const removeFromCart = async (index) => {
    try {
      state.loading = true

      if (userStore.isAuthenticated) {
        // API volání pro odstranění položky
        const item = state.items[index]

        if (item && item.dbId) {
          await axios.delete(`${API_URL}/cart/${item.dbId}`, {
            headers: {
              Authorization: `Bearer ${userStore.token}`
            }
          })
        }
      }

      // Odstranění položky z lokálního stavu
      state.items.splice(index, 1)

      // Uložení do localStorage pro nepřihlášené uživatele
      if (!userStore.isAuthenticated) {
        saveCart()
      }

      state.loading = false
    } catch (error) {
      console.error('Error removing from cart:', error)
      state.error = 'Nepodařilo se odstranit položku z košíku'
      state.loading = false
    }
  }

  // Aktualizace množství
  const updateQuantity = async (index, quantity) => {
    try {
      state.loading = true

      // Zajištění minimálního množství 1
      if (quantity < 1) quantity = 1

      if (userStore.isAuthenticated) {
        // API volání pro aktualizaci položky
        const item = state.items[index]

        if (item && item.dbId) {
          await axios.put(
            `${API_URL}/cart/${item.dbId}`,
            { quantity },
            {
              headers: {
                Authorization: `Bearer ${userStore.token}`
              }
            }
          )
        }
      }

      // Aktualizace lokálního stavu
      state.items[index].quantity = quantity

      // Uložení do localStorage pro nepřihlášené uživatele
      if (!userStore.isAuthenticated) {
        saveCart()
      }

      state.loading = false
    } catch (error) {
      console.error('Error updating quantity:', error)
      state.error = 'Nepodařilo se aktualizovat množství položky'
      state.loading = false
    }
  }

  // Zvýšení množství
  const increaseQuantity = (index) => {
    updateQuantity(index, state.items[index].quantity + 1)
  }

  // Snížení množství
  const decreaseQuantity = (index) => {
    if (state.items[index].quantity > 1) {
      updateQuantity(index, state.items[index].quantity - 1)
    }
  }

  // Nastavení způsobu dopravy
  const setShippingMethod = async (method) => {
    try {
      state.loading = true
      state.shippingMethod = method

      if (userStore.isAuthenticated) {
        // API volání pro aktualizaci způsobu dopravy
        await axios.put(
          `${API_URL}/user/preferences/shipping`,
          { shippingMethod: method },
          {
            headers: {
              Authorization: `Bearer ${userStore.token}`
            }
          }
        )
      }

      // Uložení do localStorage pro nepřihlášené uživatele
      if (!userStore.isAuthenticated) {
        saveCart()
      }

      state.loading = false
    } catch (error) {
      console.error('Error setting shipping method:', error)
      state.error = 'Nepodařilo se nastavit způsob dopravy'
      state.loading = false
    }
  }

  // Vyčištění košíku
  const clearCart = async () => {
    try {
      state.loading = true

      if (userStore.isAuthenticated) {
        // Pro každou položku v košíku zavoláme odstranění
        for (const item of state.items) {
          if (item.dbId) {
            await axios.delete(`${API_URL}/cart/${item.dbId}`, {
              headers: {
                Authorization: `Bearer ${userStore.token}`
              }
            })
          }
        }
      }

      // Resetování lokálního stavu
      state.items = []

      // Uložení do localStorage pro nepřihlášené uživatele
      if (!userStore.isAuthenticated) {
        saveCart()
      }

      state.loading = false
    } catch (error) {
      console.error('Error clearing cart:', error)
      state.error = 'Nepodařilo se vyčistit košík'
      state.loading = false
    }
  }

  // Výpočet celkové ceny zboží (bez dopravy)
  const cartTotal = computed(() => {
    return state.items.reduce((total, item) => {
      return total + parsePrice(item.price) * item.quantity
    }, 0)
  })

  // Výpočet ceny dopravy
  const shipping = computed(() => {
    return state.shippingMethod === 'delivery' ? 150 : 0
  })

  // Počet položek v košíku
  const itemCount = computed(() => {
    return state.items.reduce((count, item) => {
      return count + item.quantity
    }, 0)
  })

  return {
    items: computed(() => state.items),
    itemCount,
    cartTotal,
    shipping,
    shippingMethod: computed(() => state.shippingMethod),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    setShippingMethod,
    clearCart,
    syncCartWithServer
  }
}
