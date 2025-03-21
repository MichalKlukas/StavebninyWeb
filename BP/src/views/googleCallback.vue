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
      <div class="debug-info" v-if="debugInfo">
        <h4>Debug Info:</h4>
        <pre>{{ debugInfo }}</pre>
      </div>
      <div class="action-buttons">
        <button @click="retryAuth" class="retry-button">Zkusit znovu</button>
        <router-link to="/prihlaseni" class="back-button">Zpět na přihlášení</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useUserStore } from '../stores'
import { useCart } from '../stores/stavKosiku'
import axios from 'axios'
import api, { API_URL } from '../config/api'

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
      redirectDelay: 3000, // delay before redirect to see debug info
      authCode: null, // Store code for retry functionality
      returnUrl: '/'
    }
  },
  async mounted() {
    console.log('[GoogleCallback] Component mounted')
    await this.processAuthCode()
  },
  methods: {
    async processAuthCode() {
      // Get the authorization code from URL
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')

      // Store for potential retry
      this.authCode = code

      // Retrieve return URL from localStorage
      this.returnUrl = localStorage.getItem('returnUrl') || '/'
      console.log('[GoogleCallback] Return URL:', this.returnUrl)

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

      console.log('[GoogleCallback] Authorization code received')
      this.debugInfo = {
        step: 'Authorization code received',
        code: `${code.substring(0, 10)}...`,
        timestamp: new Date().toISOString()
      }

      try {
        // Enhanced debugging information
        console.log('[GoogleCallback] Authorization code:', code.substring(0, 10) + '...')
        console.log('[GoogleCallback] Full request URL:', `${API_URL}/auth/google/callback`)

        // Log the current environment
        console.log('[GoogleCallback] Environment variables:')
        console.log('API_URL:', API_URL)
        console.log('import.meta.env.DEV:', import.meta.env.DEV)

        // Use explicit parameters for better debugging
        const requestConfig = {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }

        console.log('[GoogleCallback] Request config:', JSON.stringify(requestConfig))

        // Make the request with explicit error handling
        let response
        try {
          this.debugInfo = {
            ...this.debugInfo,
            step: 'Sending request to server',
            endpoint: `${API_URL}/auth/google/callback`,
            timestamp: new Date().toISOString()
          }

          response = await api.post('/auth/google/callback', { code }, requestConfig)

          console.log('[GoogleCallback] Response status:', response.status)
          console.log('[GoogleCallback] Response headers:', response.headers)
        } catch (requestError) {
          console.error('[GoogleCallback] Request failed:')
          console.error('Status:', requestError.response?.status)
          console.error('Response data:', requestError.response?.data)
          console.error('Error message:', requestError.message)

          this.debugInfo = {
            ...this.debugInfo,
            step: 'Request error',
            status: requestError.response?.status,
            data: requestError.response?.data,
            message: requestError.message,
            timestamp: new Date().toISOString()
          }

          throw requestError // Re-throw to be caught by the outer try/catch
        }

        console.log('[GoogleCallback] Token response received:', {
          userReceived: !!response.data.user,
          tokenReceived: !!response.data.token,
          tokenPreview: response.data.token ? `${response.data.token.substring(0, 15)}...` : 'none'
        })

        this.debugInfo = {
          ...this.debugInfo,
          step: 'Token received',
          success: true,
          userEmail: response.data.user?.email,
          tokenStart: response.data.token ? `${response.data.token.substring(0, 10)}...` : 'none',
          timestamp: new Date().toISOString()
        }

        // Check if we received proper data
        if (!response.data.user || !response.data.token) {
          throw new Error('Server returned incomplete authentication data')
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
        await new Promise((resolve) => setTimeout(resolve, 500))

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
          ...this.debugInfo,
          step: 'Login verification',
          tokenStored: !!storedToken,
          userStored: !!storedUser,
          isLoggedIn: this.userStore.isLoggedIn,
          timestamp: new Date().toISOString()
        }

        // Verify login success
        if (!storedToken || !storedUser || !this.userStore.isLoggedIn) {
          throw new Error('Login appears to have failed despite successful server response')
        }

        // Force cart initialization
        console.log('[GoogleCallback] Manually initializing cart')
        try {
          await this.cartStore.initCart()
          console.log('[GoogleCallback] Cart manually initialized')

          this.debugInfo = {
            ...this.debugInfo,
            step: 'Cart initialized',
            timestamp: new Date().toISOString()
          }
        } catch (cartError) {
          console.error('[GoogleCallback] Cart initialization error:', cartError)
          // Continue anyway - cart issue shouldn't prevent login
        }

        // Remove returnUrl from localStorage
        localStorage.removeItem('returnUrl')

        // Redirect after delay to ensure all processes complete
        this.debugInfo = {
          ...this.debugInfo,
          step: 'Redirecting to ' + this.returnUrl,
          timestamp: new Date().toISOString()
        }

        console.log('[GoogleCallback] Redirecting to:', this.returnUrl)
        setTimeout(() => {
          this.$router.push(this.returnUrl)
        }, 1000)
      } catch (error) {
        this.loading = false
        this.error = true

        console.error('[GoogleCallback] Google authentication error:', error)
        console.error('[GoogleCallback] Error details:', error.response?.data || error.message)

        // Try to test the API endpoint connectivity
        try {
          const healthCheck = await axios.get(`${API_URL}/health`)
          console.log('[GoogleCallback] Health check response:', healthCheck.data)

          this.debugInfo = {
            ...this.debugInfo,
            step: 'Health check',
            healthStatus: healthCheck.data,
            timestamp: new Date().toISOString()
          }
        } catch (healthError) {
          console.error('[GoogleCallback] Health check failed:', healthError)
          this.debugInfo = {
            ...this.debugInfo,
            step: 'Health check failed',
            error: healthError.message,
            timestamp: new Date().toISOString()
          }
        }

        if (error.response && error.response.data && error.response.data.error) {
          this.errorMessage = error.response.data.error
        } else {
          this.errorMessage =
            'Při přihlašování přes Google došlo k neočekávané chybě. Zkuste to prosím znovu.'
        }

        this.debugInfo = {
          ...this.debugInfo,
          step: 'Error occurred',
          message: error.message,
          responseStatus: error.response?.status,
          responseData: error.response?.data,
          timestamp: new Date().toISOString()
        }
      }
    },

    // Method to allow retry of authentication
    async retryAuth() {
      if (this.authCode) {
        this.loading = true
        this.error = false
        this.debugInfo = {
          step: 'Retrying authentication',
          timestamp: new Date().toISOString()
        }
        await this.processAuthCode()
      } else {
        // No auth code available, redirect to login
        this.$router.push('/prihlaseni')
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

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.back-button,
.retry-button {
  display: inline-block;
  background-color: #f5852a;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.retry-button {
  background-color: #2a8af5;
}

.back-button:hover {
  background-color: #e67722;
}

.retry-button:hover {
  background-color: #1a70e6;
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
