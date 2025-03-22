// src/stores/useUserStore.js
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
          // Set token
          token.value = storedToken

          console.log('[UserStore] User restored from localStorage:', user.value.email)
          console.log('[UserStore] Token restored:', token.value ? 'Present' : 'Missing')

          // Ensure token has Bearer prefix
          if (token.value && !token.value.startsWith('Bearer ')) {
            token.value = `Bearer ${token.value}`
            localStorage.setItem('token', token.value)
            console.log('[UserStore] Added Bearer prefix to token')
          }

          return true
        } catch (parseError) {
          console.error('[UserStore] Error parsing user data:', parseError)
          // Clear corrupted data
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          user.value = null
          token.value = null
          return false
        }
      } else {
        console.log('[UserStore] No complete user data in localStorage')

        // Clear partial data if present
        if (userData || storedToken) {
          console.log('[UserStore] Clearing incomplete user data')
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          user.value = null
          token.value = null
        }

        return false
      }
    } catch (error) {
      console.error('[UserStore] Error during user initialization:', error)

      // Clear potentially corrupted data
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      user.value = null
      token.value = null

      return false
    }
  }

  async function login(userData, authToken) {
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

      // Update state
      user.value = userData
      token.value = formattedToken

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', formattedToken)
      console.log('[UserStore] User data saved to localStorage')

      // Verify data was saved correctly
      const verifyToken = localStorage.getItem('token')
      const verifyUser = localStorage.getItem('user')

      if (!verifyToken || !verifyUser) {
        console.error('[UserStore] Verification failed - localStorage not updated')
      } else {
        console.log('[UserStore] Verification successful')
      }

      // NOTE: The cart will be handled via the watcher in the cart store
      return true
    } catch (error) {
      console.error('[UserStore] Login error:', error)
      lastError.value = error.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    console.log('[UserStore] Logout called')

    try {
      loading.value = true
      lastError.value = null

      // IMPORTANT: First clear state
      // Cart store watches for this change
      user.value = null
      token.value = null
      console.log('[UserStore] User data cleared from state')

      // Then remove from localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      console.log('[UserStore] User data removed from localStorage')

      // We don't directly handle the cart here - the cart store's watcher will handle it

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
    getAuthStatus
  }
})
