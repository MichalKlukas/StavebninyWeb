// src/stores/index.ts
import { defineStore } from 'pinia'

// Add type definitions
interface User {
  firstName?: string
  lastName?: string
  [key: string]: any
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    token: localStorage.getItem('token') || null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userInitials: (state) => {
      if (!state.user) return ''
      const firstName = state.user.firstName || ''
      const lastName = state.user.lastName || ''
      return (firstName.charAt(0) + (lastName ? lastName.charAt(0) : '')).toUpperCase()
    }
  },
  actions: {
    login(userData: User, token: string) {
      this.user = userData
      this.token = token
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', token)
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    },
    updateProfile(userData: Partial<User>) {
      this.user = {
        ...this.user,
        ...userData
      }
      localStorage.setItem('user', JSON.stringify(this.user))
    }
  }
})
