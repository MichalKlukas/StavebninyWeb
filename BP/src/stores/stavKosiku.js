// src/stores/stavKosiku.js
import { reactive, computed } from 'vue'
import API_URL, { api } from '@/config/api' // Import both API_URL and api

// Generátor UUID
function simpleUuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Reaktivní stav košíku
const state = reactive({
  items: [],
  shippingMethod: 'pickup', // Nastavíme výchozí metodu na osobní odběr (zdarma)
  isLoading: false,
  anonymousId: null, // ID pro anonymní košík
  initialized: false, // Flag to prevent multiple initializations
  lastError: null // For debugging
})

// Získání JWT tokenu a kontrola, zda je uživatel přihlášen
const getAuthToken = () => {
  const token = localStorage.getItem('token')
  // Format token if it exists but doesn't have Bearer prefix
  if (token && !token.startsWith('Bearer ')) {
    console.log('[CartStore] Adding Bearer prefix to token')
    const formattedToken = `Bearer ${token}`
    localStorage.setItem('token', formattedToken)
    return formattedToken
  }
  return token
}

const isUserLoggedIn = () => {
  return !!getAuthToken()
}

// Uložení košíku do localStorage
const ulozitKosik = () => {
  try {
    localStorage.setItem(
      'kosik',
      JSON.stringify({
        items: state.items,
        shippingMethod: state.shippingMethod,
        anonymousId: state.anonymousId
      })
    )
    console.log('[CartStore] Cart saved to localStorage, items:', state.items.length)
  } catch (error) {
    console.error('[CartStore] Error saving cart to localStorage:', error)
    state.lastError = error.message
  }
}

// Načtení košíku z localStorage
const inicializovatLokalniKosik = () => {
  console.log('[CartStore] Initializing cart from localStorage')
  try {
    const ulozenyKosik = localStorage.getItem('kosik')
    if (ulozenyKosik) {
      const parsovanyKosik = JSON.parse(ulozenyKosik)
      state.items = parsovanyKosik.items || []
      state.shippingMethod = parsovanyKosik.shippingMethod || 'pickup'
      state.anonymousId = parsovanyKosik.anonymousId
      console.log('[CartStore] Loaded cart from localStorage, items:', state.items.length)
    } else {
      console.log('[CartStore] No cart found in localStorage')
    }

    // Pokud nemáme anonymousId, vytvoříme ho
    if (!state.anonymousId) {
      state.anonymousId = simpleUuidv4()
      ulozitKosik()
      console.log('[CartStore] Generated new anonymousId:', state.anonymousId)
    }
  } catch (error) {
    console.error('[CartStore] Error loading cart from localStorage:', error)
    state.lastError = error.message
  }
}

// Načtení košíku z API (pro přihlášené uživatele)
const nacistKosikZServeru = async () => {
  const token = getAuthToken()
  console.log(
    '[CartStore] Auth token for cart request:',
    token ? token.substring(0, 15) + '...' : 'MISSING'
  )
  if (!token) {
    console.log('[CartStore] No auth token available, skipping server load')
    alert('No authentication token found! Please try logging in again.')
    return false
  }

  try {
    state.isLoading = true
    console.log('[CartStore] Fetching cart from server: /api/user/cart')

    const response = await api.get('/user/cart')
    console.log('[CartStore] Server response:', response.data)

    if (response.data && response.data.items) {
      if (state.items.length > 0 && response.data.items.length === 0) {
        console.log('[CartStore] Local items exist, server cart empty. Syncing to server.')
        await synchronizovatKosikNaServer()
      } else if (state.items.length > 0 && response.data.items.length > 0) {
        console.log('[CartStore] Local and server items exist. Merging carts.')
        await sloucitKosiky()
      } else {
        console.log('[CartStore] Using server cart. Items:', response.data.items.length)
        state.items = response.data.items
        if (response.data.shippingMethod) {
          state.shippingMethod = response.data.shippingMethod
        }
        ulozitKosik()
      }
      return true
    } else {
      console.log('[CartStore] Server returned no items or invalid format')
      return false
    }
  } catch (error) {
    console.error('[CartStore] Error loading cart from server:', error)
    console.error('[CartStore] Error details:', error.response?.data || error.message)
    state.lastError = error.response?.data?.error || error.message
    return false
  } finally {
    state.isLoading = false
  }
}

// Synchronizace košíku na server
const synchronizovatKosikNaServer = async () => {
  const token = getAuthToken()
  if (!token) {
    console.log('[CartStore] No auth token available, skipping server sync')
    return false
  }

  try {
    state.isLoading = true
    console.log('[CartStore] Syncing cart to server: /api/user/cart')
    console.log('[CartStore] Items being sent:', state.items.length)

    const response = await api.post('/user/cart', {
      items: state.items,
      shippingMethod: state.shippingMethod
    })

    console.log('[CartStore] Sync response:', response.data)
    return true
  } catch (error) {
    console.error('[CartStore] Error syncing cart to server:', error)
    console.error('[CartStore] Error details:', error.response?.data || error.message)
    state.lastError = error.response?.data?.error || error.message
    return false
  } finally {
    state.isLoading = false
  }
}

// Sloučení lokálního a serverového košíku
const sloucitKosiky = async () => {
  const token = getAuthToken()
  if (!token) {
    console.log('[CartStore] No auth token available, skipping cart merge')
    return false
  }

  try {
    state.isLoading = true
    console.log('[CartStore] Merging carts. Local items:', state.items.length)

    const response = await api.post('/user/cart/merge', {
      anonymousCartId: state.anonymousId,
      items: state.items,
      shippingMethod: state.shippingMethod
    })

    if (response.data && response.data.items) {
      console.log('[CartStore] Merge successful. New item count:', response.data.items.length)
      state.items = response.data.items
      if (response.data.shippingMethod) {
        state.shippingMethod = response.data.shippingMethod
      }
      ulozitKosik()
      return true
    } else {
      console.log('[CartStore] Merge response has no items')
      return false
    }
  } catch (error) {
    console.error('[CartStore] Error merging carts:', error)
    console.error('[CartStore] Error details:', error.response?.data || error.message)
    state.lastError = error.response?.data?.error || error.message
    return false
  } finally {
    state.isLoading = false
  }
}

// Funkce pro práci s košíkem
export const useCart = () => {
  // Inicializace košíku - musí být volána po mounted
  const initCart = async () => {
    console.log('[CartStore] Initializing cart. Already initialized:', state.initialized)

    if (state.initialized) return

    try {
      // Nejprve načteme košík z localStorage (pro rychlé zobrazení)
      inicializovatLokalniKosik()

      // Pak zkusíme načíst košík ze serveru, pokud je uživatel přihlášen
      if (isUserLoggedIn()) {
        console.log('[CartStore] User is logged in, attempting to load from server')

        // Add retry logic
        let attempts = 0
        let success = false

        while (attempts < 3 && !success) {
          attempts++
          console.log(`[CartStore] Server load attempt ${attempts}`)

          success = await nacistKosikZServeru()

          if (!success && attempts < 3) {
            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }

        if (success) {
          console.log('[CartStore] Successfully loaded cart from server')
        } else {
          console.log('[CartStore] Failed to load cart from server after retries')
        }
      } else {
        console.log('[CartStore] User not logged in, using local cart only')
      }

      state.initialized = true
      console.log('[CartStore] Cart initialization complete')
    } catch (error) {
      console.error('[CartStore] Error in cart initialization:', error)
      state.lastError = error.message
    }
  }

  // Přidání produktu do košíku
  const addToCart = async (product) => {
    console.log('[CartStore] Adding product to cart:', product)

    // Kontrola, zda produkt již je v košíku
    const existujiciPolozka = state.items.find((item) => item.id === product.id)

    if (existujiciPolozka) {
      existujiciPolozka.quantity++
    } else {
      state.items.push({
        ...product,
        quantity: 1
      })
    }

    // Uložení do localStorage
    ulozitKosik()

    // Pokud je uživatel přihlášen, synchronizujeme na server
    if (isUserLoggedIn()) {
      await synchronizovatKosikNaServer()
    }
  }

  // Odstranění položky z košíku
  const removeFromCart = async (index) => {
    state.items.splice(index, 1)
    ulozitKosik()

    // Pokud je uživatel přihlášen, synchronizujeme na server
    if (isUserLoggedIn()) {
      await synchronizovatKosikNaServer()
    }
  }

  // Aktualizace množství
  const updateQuantity = async (index, quantity) => {
    if (quantity < 1) quantity = 1
    state.items[index].quantity = quantity
    ulozitKosik()

    // Pokud je uživatel přihlášen, synchronizujeme na server
    if (isUserLoggedIn()) {
      await synchronizovatKosikNaServer()
    }
  }

  // Zvýšení množství
  const increaseQuantity = async (index) => {
    state.items[index].quantity++
    ulozitKosik()

    // Pokud je uživatel přihlášen, synchronizujeme na server
    if (isUserLoggedIn()) {
      await synchronizovatKosikNaServer()
    }
  }

  // Snížení množství
  const decreaseQuantity = async (index) => {
    if (state.items[index].quantity > 1) {
      state.items[index].quantity--
      ulozitKosik()

      // Pokud je uživatel přihlášen, synchronizujeme na server
      if (isUserLoggedIn()) {
        await synchronizovatKosikNaServer()
      }
    }
  }

  // Nastavení způsobu dopravy
  const setShippingMethod = async (method) => {
    state.shippingMethod = method
    ulozitKosik()

    // Pokud je uživatel přihlášen, synchronizujeme na server
    if (isUserLoggedIn()) {
      await synchronizovatKosikNaServer()
    }
  }

  // Vyčištění košíku
  const clearCart = async () => {
    state.items = []
    ulozitKosik()

    // Pokud je uživatel přihlášen, synchronizujeme na server
    if (isUserLoggedIn()) {
      await synchronizovatKosikNaServer()
    }
  }

  // Obsluha přihlášení uživatele
  const handleLogin = async () => {
    console.log('[CartStore] User logged in, handling cart')

    // Clear the current cart from memory but keep local storage
    // until we fetch from server
    state.items = []

    // Force complete reinitialization
    state.initialized = false

    // Wait for server to sync
    const success = await nacistKosikZServeru()

    if (!success) {
      // If server sync failed, reload from localStorage
      // as a fallback only
      inicializovatLokalniKosik()
    }

    state.initialized = true
  }

  // Obsluha odhlášení uživatele
  const handleLogout = () => {
    console.log('[CartStore] User logged out, handling cart')
    // Generate new anonymous ID
    state.anonymousId = simpleUuidv4()
    // Keep items but mark as needing reinitialization on next login
    state.initialized = false
    ulozitKosik()
  }

  // Debug function to check cart status
  const getStatus = () => {
    return {
      initialized: state.initialized,
      itemCount: state.items.length,
      isLoggedIn: isUserLoggedIn(),
      anonymousId: state.anonymousId,
      lastError: state.lastError
    }
  }

  // Výpočet celkové ceny zboží (bez dopravy)
  const cartTotal = computed(() => {
    return state.items.reduce((total, item) => {
      return total + parseFloat(item.price) * item.quantity
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

  // Stav načítání
  const isLoading = computed(() => state.isLoading)

  return {
    // State
    items: computed(() => state.items),
    itemCount,
    cartTotal,
    shipping,
    isLoading,
    shippingMethod: computed(() => state.shippingMethod),

    // Metody
    initCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    setShippingMethod,
    clearCart,
    handleLogin,
    handleLogout,
    getStatus // Debug method
  }
}
