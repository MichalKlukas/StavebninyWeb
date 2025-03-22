// src/stores/stavKosiku.d.ts
declare module '@/stores/stavKosiku.js' {
  import { ComputedRef, Ref } from 'vue'

  interface CartItem {
    id: number | string
    name: string
    price: number | string
    image?: string
    quantity: number
    priceUnit?: string
  }

  interface CartStore {
    // State (these should be Ref not ComputedRef)
    items: Ref<CartItem[]>
    shippingMethod: Ref<string>
    isLoading: Ref<boolean>
    error: Ref<string | null>
    lastSyncTime: Ref<Date | null>

    // Getters (these are correctly ComputedRef)
    itemCount: ComputedRef<number>
    cartTotal: ComputedRef<number>
    shipping: ComputedRef<number>

    // Debug methods
    getStatus: () => { initialized: string; itemCount: number; lastError: string | null }

    // Actions
    addToCart: (product: any, quantity?: number) => Promise<void>
    removeFromCart: (index: number) => Promise<void>
    updateQuantity: (index: number, quantity: number) => Promise<void>
    increaseQuantity: (index: number) => Promise<void>
    decreaseQuantity: (index: number) => Promise<void>
    setShippingMethod: (method: string) => Promise<void>
    clearCart: () => Promise<void>
    initCart: () => Promise<void>
    loadUserCart: () => Promise<void>
    saveUserCart: () => Promise<void>
    handleLogin: () => Promise<void>
    handleLogout: () => void
  }

  export function useCart(): CartStore
}
