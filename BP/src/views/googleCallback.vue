<!-- src/views/googleCallback.vue -->
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/useUserStore'
import { useCartStore } from '../stores/cartStore'
import api from '../config/api'

export default {
  name: 'GoogleCallback',
  setup() {
    const userStore = useUserStore()
    const cartStore = useCartStore()
    const router = useRouter()

    // State
    const loading = ref(true)
    const error = ref(false)
    const errorMessage = ref('')
    const debugInfo = ref(null)
    const authCode = ref(null)
    const returnUrl = ref('/')

    // Initialize component
    onMounted(async () => {
      console.log('[GoogleCallback] Component mounted')
      await processAuthCode()
    })

    const processAuthCode = async () => {
      // Get the authorization code from URL
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const googleError = urlParams.get('error')

      // Store for potential retry
      authCode.value = code

      // Retrieve return URL from localStorage
      returnUrl.value = localStorage.getItem('returnUrl') || '/'
      console.log('[GoogleCallback] Return URL:', returnUrl.value)

      // Handle errors from Google
      if (googleError) {
        console.error('[GoogleCallback] Google returned error:', googleError)
        loading.value = false
        error.value = true
        errorMessage.value = 'Přihlášení přes Google bylo zrušeno nebo zamítnuto.'
        return
      }

      // If no code is present, redirect to login
      if (!code) {
        console.error('[GoogleCallback] No authorization code present')
        loading.value = false
        error.value = true
        errorMessage.value = 'Chybí autorizační kód. Zkuste prosím přihlášení znovu.'
        return
      }

      console.log('[GoogleCallback] Authorization code received')
      debugInfo.value = {
        step: 'Authorization code received',
        code: `${code.substring(0, 10)}...`,
        timestamp: new Date().toISOString()
      }

      try {
        // Make request to backend to exchange code for token
        debugInfo.value = {
          ...debugInfo.value,
          step: 'Sending request to server',
          timestamp: new Date().toISOString()
        }

        const response = await api.post('/auth/google/callback', { code })

        debugInfo.value = {
          ...debugInfo.value,
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

        // Format token if needed
        const formattedToken = response.data.token.startsWith('Bearer ')
          ? response.data.token
          : `Bearer ${response.data.token}`

        // Set user state in store
        console.log('[GoogleCallback] Calling userStore.login')
        await userStore.login(response.data.user, formattedToken)
        console.log('[GoogleCallback] userStore.login completed')

        // Initialize cart and merge
        console.log('[GoogleCallback] Merging cart after Google login')

        try {
          await cartStore.handleLogin()
          console.log('[GoogleCallback] Cart merged successfully')

          debugInfo.value = {
            ...debugInfo.value,
            step: 'Cart merged',
            itemCount: cartStore.itemCount,
            timestamp: new Date().toISOString()
          }
        } catch (cartError) {
          console.error('[GoogleCallback] Cart merge error:', cartError)
          // Continue anyway - cart issue shouldn't prevent login
        }

        // Remove returnUrl from localStorage
        localStorage.removeItem('returnUrl')

        // Redirect to the return URL
        debugInfo.value = {
          ...debugInfo.value,
          step: 'Redirecting to ' + returnUrl.value,
          timestamp: new Date().toISOString()
        }

        console.log('[GoogleCallback] Redirecting to:', returnUrl.value)

        // Short delay to ensure everything is processed
        setTimeout(() => {
          router.push(returnUrl.value)
        }, 1000)
      } catch (error) {
        loading.value = false
        error.value = true

        console.error('[GoogleCallback] Google authentication error:', error)

        if (error.response && error.response.data && error.response.data.error) {
          errorMessage.value = error.response.data.error
        } else {
          errorMessage.value =
            'Při přihlašování přes Google došlo k neočekávané chybě. Zkuste to prosím znovu.'
        }

        debugInfo.value = {
          ...debugInfo.value,
          step: 'Error occurred',
          message: error.message,
          responseStatus: error.response?.status,
          responseData: error.response?.data,
          timestamp: new Date().toISOString()
        }
      }
    }

    const retryAuth = async () => {
      if (authCode.value) {
        loading.value = true
        error.value = false
        debugInfo.value = {
          step: 'Retrying authentication',
          timestamp: new Date().toISOString()
        }
        await processAuthCode()
      } else {
        // No auth code available, redirect to login
        router.push('/prihlaseni')
      }
    }

    return {
      loading,
      error,
      errorMessage,
      debugInfo,
      retryAuth
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
