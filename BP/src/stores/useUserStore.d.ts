// src/stores/useUserStore.d.ts
declare module '@/stores/useUserStore.js' {
  import { ComputedRef } from 'vue'

  interface User {
    id: number | string
    firstName?: string
    lastName?: string
    email: string
    [key: string]: any // For any additional properties
  }

  interface UserStore {
    user: User | null
    token: string | null
    loading: boolean
    isLoggedIn: ComputedRef<boolean>
    fullName: ComputedRef<string>
    init: () => void
    login: (user: User, token: string) => Promise<void>
    logout: () => void
  }

  export function useUserStore(): UserStore
}
