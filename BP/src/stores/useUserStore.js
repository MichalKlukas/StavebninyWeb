// src/stores/useUserStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim()
  })

  // Actions
  function init() {
    // Načtení uživatele z localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        user.value = JSON.parse(userData)
      } catch (e) {
        console.error('Chyba při parsování dat uživatele:', e)
      }
    }
  }

  async function login(userData, authToken) {
    user.value = userData
    token.value = authToken

    // Uložení do localStorage
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', authToken)

    // Aktualizace košíku po přihlášení
    const { useCart } = await import('./stavKosiku')
    const cartStore = useCart()
    await cartStore.handleLogin()
  }

  function logout() {
    // Aktualizace košíku před odhlášením
    const { useCart } = import('./stavKosiku')
    const cartStore = useCart()
    cartStore.handleLogout()

    // Odstranění dat uživatele
    user.value = null
    token.value = null

    // Odstranění z localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    loading,
    isLoggedIn,
    fullName,
    init,
    login,
    logout
  }
})
