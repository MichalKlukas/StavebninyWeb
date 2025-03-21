import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCart } from './stavKosiku' // Import directly to avoid dynamic import issues

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
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
      verifyTokenFormat()
      if (userData && storedToken) {
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

        loading.value = false
        return true
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

        loading.value = false
        return false
      }
    } catch (error) {
      console.error('[UserStore] Error during user initialization:', error)

      // Clear potentially corrupted data
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      user.value = null
      token.value = null

      loading.value = false
      return false
    }
  }
  function verifyTokenFormat() {
    const storedToken = localStorage.getItem('token')
    console.log('[UserStore] Token verification:')
    console.log('- Token in state:', token.value ? 'Present' : 'Missing')
    console.log('- Token in localStorage:', storedToken ? 'Present' : 'Missing')

    if (storedToken && !storedToken.startsWith('Bearer ')) {
      console.log('- Fixing token format in localStorage')
      const fixedToken = `Bearer ${storedToken}`
      localStorage.setItem('token', fixedToken)
      token.value = fixedToken
      return fixedToken
    }

    return storedToken
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

      // Handle cart login with retry logic
      let cartInitSuccess = false
      let attempts = 0

      while (!cartInitSuccess && attempts < 3) {
        try {
          attempts++
          console.log(`[UserStore] Attempting cart handling (attempt ${attempts})`)

          const cartStore = useCart()
          await cartStore.handleLogin()

          // Force cart initialization
          await cartStore.initCart()

          console.log('[UserStore] Cart handling completed successfully')
          cartInitSuccess = true
        } catch (error) {
          console.error(`[UserStore] Cart handling error (attempt ${attempts}):`, error)

          if (attempts < 3) {
            console.log('[UserStore] Retrying cart initialization...')
            await new Promise((resolve) => setTimeout(resolve, 500)) // Wait before retry
          } else {
            console.error('[UserStore] Maximum cart initialization attempts reached')
            lastError.value = 'Cart initialization failed'
          }
        }
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

  async function logout() {
    console.log('[UserStore] Logout called')

    try {
      loading.value = true
      lastError.value = null

      // Handle cart logout
      try {
        const cartStore = useCart()
        console.log('[UserStore] Calling cart.handleLogout()')
        cartStore.handleLogout()
        console.log('[UserStore] Cart handleLogout completed')
      } catch (error) {
        console.error('[UserStore] Error in cart handling during logout:', error)
      }

      // Clear user state
      user.value = null
      token.value = null
      console.log('[UserStore] User data cleared from state')

      // Remove from localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      console.log('[UserStore] User data removed from localStorage')

      return true
    } catch (error) {
      console.error('[UserStore] Logout error:', error)
      lastError.value = error.message
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
