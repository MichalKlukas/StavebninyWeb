// src/stores/cartStore.d.ts
import { ComputedRef, Ref } from 'vue'

export interface CartItem {
  id: number | string
  name: string
  price: number
  image?: string
  quantity: number
  priceUnit?: string
}

export interface CartStore {
  // State
  items: Ref<CartItem[]>
  shippingMethod: Ref<string>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  lastSyncTime: Ref<Date | null>

  // Getters
  itemCount: ComputedRef<number>
  cartTotal: ComputedRef<number>
  shipping: ComputedRef<number>

  // Actions
  initCart: () => Promise<void>
  loadUserCart: () => Promise<void>
  saveUserCart: () => Promise<void>
  addToCart: (product: any, quantity?: number) => Promise<void>
  removeFromCart: (index: number) => Promise<void>
  updateQuantity: (index: number, quantity: number) => Promise<void>
  increaseQuantity: (index: number) => Promise<void>
  decreaseQuantity: (index: number) => Promise<void>
  setShippingMethod: (method: string) => Promise<void>
  clearCart: () => Promise<void>
  handleLogin: () => Promise<void>
  handleLogout: () => void
}

export function useCartStore(): CartStore
