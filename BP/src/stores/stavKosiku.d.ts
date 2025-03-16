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
    addToCart: (product: any) => void
    removeFromCart: (index: number) => void
    updateQuantity: (index: number, quantity: number) => void
    increaseQuantity: (index: number) => void
    decreaseQuantity: (index: number) => void
    setShippingMethod: (method: string) => void
    clearCart: () => void
  }

  export function useCart(): CartStore
}
