// src/stores/stavKosiku.d.ts
declare module '@/stores/stavKosiku.js' {
  import { ComputedRef } from 'vue'

  interface CartItem {
    id: number | string
    name: string
    price: number | string
    image?: string
    quantity: number
    priceUnit?: string
  }

  interface CartStore {
    items: ComputedRef<CartItem[]>
    itemCount: ComputedRef<number>
    cartTotal: ComputedRef<number>
    shipping: ComputedRef<number>
    shippingMethod: ComputedRef<string>
    isLoading: ComputedRef<boolean>
    addToCart: (product: any) => Promise<void>
    removeFromCart: (index: number) => Promise<void>
    updateQuantity: (index: number, quantity: number) => Promise<void>
    increaseQuantity: (index: number) => Promise<void>
    decreaseQuantity: (index: number) => Promise<void>
    setShippingMethod: (method: string) => Promise<void>
    clearCart: () => Promise<void>
    initCart: () => Promise<void>
    handleLogin: () => Promise<void>
    handleLogout: () => void
  }

  export function useCart(): CartStore
}
