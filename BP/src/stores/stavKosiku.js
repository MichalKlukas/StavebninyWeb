// src/stores/stavKosiku.js
import { reactive, computed } from 'vue'
import axios from 'axios'
import API_URL from '@/config/api'

// Importujeme uuid (budete muset nainstalovat: npm install uuid)
// import { v4 as uuidv4 } from 'uuid'
// Pokud nechcete přidávat novou závislost, můžeme použít jednoduchý náhradní generátor UUID
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
  initialized: false // Flag to prevent multiple initializations
})

// Získání JWT tokenu a kontrola, zda je uživatel přihlášen
const getAuthToken = () => {
  return localStorage.getItem('token')
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
  } catch (error) {
    console.error('Chyba při ukládání košíku do úložiště:', error)
  }
}

// Načtení košíku z localStorage
const inicializovatLokalniKosik = () => {
  console.log('Inicializuji košík z localStorage')
  try {
    const ulozenyKosik = localStorage.getItem('kosik')
    console.log('Načtený košík:', ulozenyKosik)
    if (ulozenyKosik) {
      const parsovanyKosik = JSON.parse(ulozenyKosik)
      state.items = parsovanyKosik.items || []
      state.shippingMethod = parsovanyKosik.shippingMethod || 'pickup'
      state.anonymousId = parsovanyKosik.anonymousId
    }

    // Pokud nemáme anonymousId, vytvoříme ho
    if (!state.anonymousId) {
      state.anonymousId = simpleUuidv4() // or uuidv4() if installed
      ulozitKosik()
    }
  } catch (error) {
    console.error('Chyba při načítání košíku z úložiště:', error)
  }
}

// Načtení košíku z API (pro přihlášené uživatele)
const nacistKosikZServeru = async () => {
  const token = getAuthToken()
  if (!token) return false

  try {
    state.isLoading = true
    const response = await axios.get(`${API_URL}/user/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (response.data && response.data.items) {
      // Pokud máme položky v lokálním košíku a server vrátil prázdný košík,
      // tak synchronizujeme lokální košík na server
      if (state.items.length > 0 && response.data.items.length === 0) {
        await synchronizovatKosikNaServer()
      }
      // Pokud máme položky v lokálním košíku a server také má položky,
      // nabídneme sloučení (nebo automaticky sloučíme)
      else if (state.items.length > 0 && response.data.items.length > 0) {
        await sloucitKosiky()
      }
      // Jinak prostě použijeme serverový košík
      else {
        state.items = response.data.items
        if (response.data.shippingMethod) {
          state.shippingMethod = response.data.shippingMethod
        }
        ulozitKosik() // Uložíme i do localStorage pro offline použití
      }
      return true
    }
  } catch (error) {
    console.error('Chyba při načítání košíku ze serveru:', error)
  } finally {
    state.isLoading = false
  }
  return false
}

// Synchronizace košíku na server
const synchronizovatKosikNaServer = async () => {
  const token = getAuthToken()
  if (!token) return false

  try {
    state.isLoading = true
    await axios.post(
      `${API_URL}/user/cart`,
      {
        items: state.items,
        shippingMethod: state.shippingMethod
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    return true
  } catch (error) {
    console.error('Chyba při synchronizaci košíku na server:', error)
  } finally {
    state.isLoading = false
  }
  return false
}

// Sloučení lokálního a serverového košíku
const sloucitKosiky = async () => {
  const token = getAuthToken()
  if (!token) return false

  try {
    state.isLoading = true
    const response = await axios.post(
      `${API_URL}/user/cart/merge`,
      {
        anonymousCartId: state.anonymousId,
        items: state.items,
        shippingMethod: state.shippingMethod
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    if (response.data && response.data.items) {
      state.items = response.data.items
      if (response.data.shippingMethod) {
        state.shippingMethod = response.data.shippingMethod
      }
      ulozitKosik()
      return true
    }
  } catch (error) {
    console.error('Chyba při slučování košíků:', error)
  } finally {
    state.isLoading = false
  }
  return false
}

// Funkce pro práci s košíkem
export const useCart = () => {
  // Inicializace košíku - musí být volána po mounted
  const initCart = async () => {
    if (state.initialized) return

    // Nejprve načteme košík z localStorage (pro rychlé zobrazení)
    inicializovatLokalniKosik()

    // Pak zkusíme načíst košík ze serveru, pokud je uživatel přihlášen
    if (isUserLoggedIn()) {
      await nacistKosikZServeru()
    }

    state.initialized = true
  }

  // Přidání produktu do košíku
  const addToCart = async (product) => {
    // Kontrola, zda produkt již je v košíku
    const existujiciPolozka = state.items.find((item) => item.id === product.id)

    if (existujiciPolozka) {
      // Pokud produkt už v košíku je, zvýšíme množství
      existujiciPolozka.quantity++
    } else {
      // Přidání nového produktu do košíku s množstvím 1
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

  // Obsluha přihlášení uživatele - zavolejte tuto funkci po úspěšném přihlášení
  const handleLogin = async () => {
    await nacistKosikZServeru()
  }

  // Obsluha odhlášení uživatele - zavolejte tuto funkci po odhlášení
  const handleLogout = () => {
    // Když se uživatel odhlásí, zachováme košík v localStorage,
    // ale vymažeme anonymousId, aby se vygeneroval nový
    state.anonymousId = simpleUuidv4() // or uuidv4() if installed
    ulozitKosik()
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
    handleLogout
  }
}
