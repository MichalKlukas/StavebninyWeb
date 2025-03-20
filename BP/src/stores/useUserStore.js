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
    console.log('[UserStore] Initializing user store')
    // Načtení uživatele z localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        user.value = JSON.parse(userData)
        console.log('[UserStore] User loaded from localStorage:', user.value.email)
      } catch (e) {
        console.error('[UserStore] Error parsing user data:', e)
      }
    } else {
      console.log('[UserStore] No user data in localStorage')
    }
  }

  async function login(userData, authToken) {
    console.log('[UserStore] Login called with user:', userData)
    user.value = userData
    token.value = authToken

    // Uložení do localStorage
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', authToken)
    console.log('[UserStore] User data saved to localStorage')

    try {
      // Correctly await the dynamic import
      console.log('[UserStore] Loading cart store module...')
      const cartModule = await import('./stavKosiku')
      const cartStore = cartModule.useCart()
      console.log('[UserStore] Calling cart handleLogin method')
      await cartStore.handleLogin()
      console.log('[UserStore] Cart handleLogin completed')
    } catch (error) {
      console.error('[UserStore] Error in cart handling during login:', error)
    }
  }

  async function logout() {
    console.log('[UserStore] Logout called')

    try {
      // Correctly await the dynamic import
      console.log('[UserStore] Loading cart store module...')
      const cartModule = await import('./stavKosiku')
      const cartStore = cartModule.useCart()
      console.log('[UserStore] Calling cart handleLogout method')
      cartStore.handleLogout()
      console.log('[UserStore] Cart handleLogout completed')
    } catch (error) {
      console.error('[UserStore] Error in cart handling during logout:', error)
    }

    // Odstranění dat uživatele
    user.value = null
    token.value = null
    console.log('[UserStore] User data cleared from state')

    // Odstranění z localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    console.log('[UserStore] User data removed from localStorage')
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
