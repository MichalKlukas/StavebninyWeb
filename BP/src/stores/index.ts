// src/stores/index.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
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
    login(userData, token) {
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
    }, // <-- Chybí čárka zde po logout() metodě!
    updateProfile(userData) {
      this.user = {
        ...this.user,
        ...userData
      }
      localStorage.setItem('user', JSON.stringify(this.user))
    }
  }
})
