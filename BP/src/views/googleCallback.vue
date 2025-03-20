<template>
  <div class="callback-container">
    <div class="processing-message" v-if="loading">
      <div class="spinner"></div>
      <h2>Zpracování přihlášení...</h2>
      <p>Prosím počkejte, probíhá ověřování vašeho Google účtu.</p>
      <div class="debug-info" v-if="debugInfo">
        <h4>Debug Info:</h4>
        <pre>{{ debugInfo }}</pre>
      </div>
    </div>

    <div class="error-message" v-if="error">
      <h2>Chyba při přihlašování</h2>
      <p>{{ errorMessage }}</p>
      <router-link to="/prihlaseni" class="back-button">Zpět na přihlášení</router-link>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useUserStore } from '../stores'
import { useCart } from '../stores/stavKosiku'
import axios from 'axios'
import API_URL from '../config/api'

export default {
  name: 'GoogleCallback',
  setup() {
    const userStore = useUserStore()
    const cartStore = useCart()
    const debugInfo = ref(null)

    return { userStore, cartStore, debugInfo }
  },
  data() {
    return {
      loading: true,
      error: false,
      errorMessage: '',
      redirectDelay: 3000 // delay before redirect to see debug info
    }
  },
  async mounted() {
    console.log('[GoogleCallback] Component mounted')

    // Get the authorization code from URL
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')

    // Retrieve return URL from localStorage
    const returnUrl = localStorage.getItem('returnUrl') || '/'
    console.log('[GoogleCallback] Return URL:', returnUrl)

    // Handle errors from Google
    if (error) {
      console.error('[GoogleCallback] Google returned error:', error)
      this.loading = false
      this.error = true
      this.errorMessage = 'Přihlášení přes Google bylo zrušeno nebo zamítnuto.'
      return
    }

    // If no code is present, redirect to login
    if (!code) {
      console.error('[GoogleCallback] No authorization code present')
      this.loading = false
      this.error = true
      this.errorMessage = 'Chybí autorizační kód. Zkuste prosím přihlášení znovu.'
      return
    }

    console.log('[GoogleCallback] Authorization code received, exchanging for token')
    this.debugInfo = {
      step: 'Exchanging code for token',
      code: `${code.substring(0, 10)}...`,
      timestamp: new Date().toISOString()
    }

    try {
      // Exchange the authorization code for tokens
      console.log('[GoogleCallback] Sending request to:', `${API_URL}/api/auth/google/callback`)
      const response = await axios.post(`${API_URL}/auth/google/callback`, { code })

      console.log('[GoogleCallback] Token response received:', {
        userReceived: !!response.data.user,
        tokenReceived: !!response.data.token,
        tokenPreview: response.data.token ? `${response.data.token.substring(0, 15)}...` : 'none'
      })

      this.debugInfo = {
        step: 'Token received',
        success: true,
        userEmail: response.data.user?.email,
        tokenStart: response.data.token ? `${response.data.token.substring(0, 10)}...` : 'none',
        timestamp: new Date().toISOString()
      }

      // Format token if needed (ensure it has 'Bearer ' prefix)
      const formattedToken = response.data.token.startsWith('Bearer ')
        ? response.data.token
        : `Bearer ${response.data.token}`

      // Set user state in store
      console.log('[GoogleCallback] Calling userStore.login')
      await this.userStore.login(response.data.user, formattedToken)
      console.log('[GoogleCallback] userStore.login completed')

      // Verify token storage
      setTimeout(() => {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        console.log('[GoogleCallback] Verification after login:')
        console.log(
          '- Token stored:',
          storedToken ? `${storedToken.substring(0, 15)}...` : 'MISSING'
        )
        console.log('- User stored:', storedUser ? 'YES' : 'MISSING')
        console.log('- User logged in according to store:', this.userStore.isLoggedIn)

        this.debugInfo = {
          step: 'Login verification',
          tokenStored: !!storedToken,
          userStored: !!storedUser,
          isLoggedIn: this.userStore.isLoggedIn,
          cartInitialized: this.cartStore.getStatus
            ? this.cartStore.getStatus().initialized
            : 'unknown',
          timestamp: new Date().toISOString()
        }

        // Force cart initialization
        console.log('[GoogleCallback] Manually initializing cart')
        this.cartStore.initCart().then(() => {
          console.log('[GoogleCallback] Cart manually initialized')

          // Remove returnUrl from localStorage
          localStorage.removeItem('returnUrl')

          // Redirect after delay
          console.log('[GoogleCallback] Redirecting to:', returnUrl)
          this.$router.push(returnUrl)
        })
      }, 1000)
    } catch (error) {
      this.loading = false
      this.error = true

      console.error('[GoogleCallback] Google authentication error:', error)
      console.error('[GoogleCallback] Error details:', error.response?.data || error.message)

      if (error.response && error.response.data && error.response.data.error) {
        this.errorMessage = error.response.data.error
      } else {
        this.errorMessage =
          'Při přihlašování přes Google došlo k neočekávané chybě. Zkuste to prosím znovu.'
      }

      this.debugInfo = {
        step: 'Error occurred',
        message: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        timestamp: new Date().toISOString()
      }
    }
  }
}
</script>

<style scoped>
.callback-container {
  max-width: 600px;
  margin: 100px auto;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.processing-message,
.error-message {
  padding: 20px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #f5852a;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

h2 {
  font-size: 24px;
  margin-bottom: 15px;
  color: #333;
}

p {
  color: #555;
  margin-bottom: 25px;
  line-height: 1.5;
}

.back-button {
  display: inline-block;
  background-color: #f5852a;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #e67722;
}

.error-message h2 {
  color: #e63946;
}

.debug-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
  text-align: left;
  font-size: 12px;
}

.debug-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #666;
}

.debug-info pre {
  margin: 0;
  white-space: pre-wrap;
  overflow-x: auto;
  background-color: #f1f1f1;
  padding: 8px;
  border-radius: 3px;
}
</style>
