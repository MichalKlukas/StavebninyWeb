// src/stores/stavKosiku.js
import { reactive, computed } from 'vue'

// Reaktivní stav košíku
const state = reactive({
  items: [],
  shippingMethod: 'pickup' // Nastavíme výchozí metodu na osobní odběr (zdarma)
})

// Vyčistit localStorage pro košík (jednorázový reset)
//localStorage.removeItem('kosik')

// Inicializace košíku z localStorage pokud existuje
const inicializovatKosik = () => {
  console.log('Inicializuji košík z localStorage')
  try {
    const ulozenyKosik = localStorage.getItem('kosik')
    console.log('Načtený košík:', ulozenyKosik)
    if (ulozenyKosik) {
      const parsovanyKosik = JSON.parse(ulozenyKosik)
      state.items = parsovanyKosik.items || []
      state.shippingMethod = parsovanyKosik.shippingMethod || 'pickup'
    }
  } catch (error) {
    console.error('Chyba při načítání košíku z úložiště:', error)
  }
}

// Uložení košíku do localStorage
const ulozitKosik = () => {
  try {
    localStorage.setItem(
      'kosik',
      JSON.stringify({
        items: state.items,
        shippingMethod: state.shippingMethod
      })
    )
  } catch (error) {
    console.error('Chyba při ukládání košíku do úložiště:', error)
  }
}

// Funkce pro práci s košíkem
export const useCart = () => {
  // Inicializace při prvním importu
  inicializovatKosik()

  // Přidání produktu do košíku
  const addToCart = (product) => {
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
  }

  // Odstranění položky z košíku
  const removeFromCart = (index) => {
    state.items.splice(index, 1)
    ulozitKosik()
  }

  // Aktualizace množství
  const updateQuantity = (index, quantity) => {
    if (quantity < 1) quantity = 1
    state.items[index].quantity = quantity
    ulozitKosik()
  }

  // Zvýšení množství
  const increaseQuantity = (index) => {
    state.items[index].quantity++
    ulozitKosik()
  }

  // Snížení množství
  const decreaseQuantity = (index) => {
    if (state.items[index].quantity > 1) {
      state.items[index].quantity--
      ulozitKosik()
    }
  }

  // Nastavení způsobu dopravy
  const setShippingMethod = (method) => {
    state.shippingMethod = method
    ulozitKosik()
  }

  // Vyčištění košíku
  const clearCart = () => {
    state.items = []
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

  return {
    items: computed(() => state.items),
    itemCount,
    cartTotal,
    shipping,
    shippingMethod: computed({
      get: () => state.shippingMethod,
      set: (value) => {
        state.shippingMethod = value
        ulozitKosik()
      }
    }),
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    setShippingMethod,
    clearCart
  }
}
