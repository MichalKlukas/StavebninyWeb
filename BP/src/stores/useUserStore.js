// src/stores/useUserStore.js - FIXED VERSION
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const token = ref(null)
  const loading = ref(false)
  const lastError = ref(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim()
  })

  // Helper to format token with Bearer prefix if needed
  const formatToken = (authToken) => {
    if (!authToken) return null
    return authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`
  }

  // Actions
  function init() {
    console.log('[UserStore] Initializing user store')

    try {
      // Load user from localStorage
      const userData = localStorage.getItem('user')
      const storedToken = localStorage.getItem('token')

      if (userData && storedToken) {
        try {
          // Parse user data
          user.value = JSON.parse(userData)
          // Set token with correct format
          token.value = formatToken(storedToken)

          // Always ensure token is saved with Bearer prefix
          if (token.value !== storedToken) {
            console.log('[UserStore] Fixing token format in localStorage')
            localStorage.setItem('token', token.value)
          }

          console.log('[UserStore] User restored from localStorage:', user.value.email)
          console.log('[UserStore] Token restored:', token.value ? 'Present' : 'Missing')

          return true
        } catch (parseError) {
          console.error('[UserStore] Error parsing user data:', parseError)
          // Clear corrupted data
          logout(false) // Silent logout with no callback
          return false
        }
      } else {
        console.log('[UserStore] No complete user data in localStorage')

        // Clear partial data if present
        if (userData || storedToken) {
          console.log('[UserStore] Clearing incomplete user data')
          logout(false) // Silent logout with no callback
        }

        return false
      }
    } catch (error) {
      console.error('[UserStore] Error during user initialization:', error)

      // Clear potentially corrupted data
      logout(false) // Silent logout with no callback
      return false
    }
  }

  async function login(userData, authToken, callbackFn = null) {
    console.log('[UserStore] Login called with:', {
      user: userData?.email,
      tokenProvided: !!authToken
    })

    try {
      loading.value = true
      lastError.value = null

      // Validate input
      if (!userData || !authToken) {
        throw new Error('Missing user data or authentication token')
      }

      // Format token properly
      const formattedToken = formatToken(authToken)
      console.log('[UserStore] Token formatted:', formattedToken ? 'Success' : 'Failed')

      // Important: First update local state before localStorage
      // This ensures the watch handlers in cart store are triggered correctly
      user.value = userData
      token.value = formattedToken

      // Then save to localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', formattedToken)
      console.log('[UserStore] User data saved to localStorage')

      // Run callback if provided (e.g., for cart sync)
      if (callbackFn && typeof callbackFn === 'function') {
        await callbackFn()
      }

      return true
    } catch (error) {
      console.error('[UserStore] Login error:', error)
      lastError.value = error.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout(callbackFn = null) {
    console.log('[UserStore] Logout called')

    try {
      loading.value = true
      lastError.value = null

      // Important: First change local state to trigger watchers in cart store
      user.value = null
      token.value = null
      console.log('[UserStore] User data cleared from state')

      // Then remove from localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      console.log('[UserStore] User data removed from localStorage')

      // Run callback if provided (e.g., for cart reset)
      if (callbackFn && typeof callbackFn === 'function') {
        await callbackFn()
      }

      return true
    } catch (error) {
      console.error('[UserStore] Logout error:', error)
      lastError.value = error.message

      // Ensure user is logged out even in case of error
      user.value = null
      token.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')

      return false
    } finally {
      loading.value = false
    }
  }

  // Debug function
  function getAuthStatus() {
    return {
      isLoggedIn: isLoggedIn.value,
      hasUser: !!user.value,
      hasToken: !!token.value,
      tokenFormat: token.value
        ? token.value.startsWith('Bearer ')
          ? 'Bearer format'
          : 'Missing Bearer prefix'
        : 'No token',
      userName: user.value?.email || 'None',
      lastError: lastError.value
    }
  }

  // For compatibility with existing code
  function forceLogout() {
    console.log('[UserStore] Force logout')
    return logout()
  }

  return {
    user,
    token,
    loading,
    lastError,
    isLoggedIn,
    fullName,
    init,
    login,
    logout,
    getAuthStatus,
    forceLogout
  }
})
