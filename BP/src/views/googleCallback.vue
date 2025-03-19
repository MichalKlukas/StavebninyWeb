<template>
  <div class="callback-container">
    <div class="processing-message" v-if="loading">
      <div class="spinner"></div>
      <h2>Zpracování přihlášení...</h2>
      <p>Prosím počkejte, probíhá ověřování vašeho Google účtu.</p>
    </div>

    <div class="error-message" v-if="error">
      <h2>Chyba při přihlašování</h2>
      <p>{{ errorMessage }}</p>
      <router-link to="/prihlaseni" class="back-button"> Zpět na přihlášení </router-link>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../stores'
import axios from 'axios'

export default {
  name: 'GoogleCallback',
  setup() {
    const userStore = useUserStore()
    return { userStore }
  },
  data() {
    return {
      loading: true,
      error: false,
      errorMessage: ''
    }
  },
  async mounted() {
    // Get the authorization code from URL
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')

    // Retrieve return URL from localStorage
    const returnUrl = localStorage.getItem('returnUrl') || '/'

    // Handle errors from Google
    if (error) {
      this.loading = false
      this.error = true
      this.errorMessage = 'Přihlášení přes Google bylo zrušeno nebo zamítnuto.'
      return
    }

    // If no code is present, redirect to login
    if (!code) {
      this.loading = false
      this.error = true
      this.errorMessage = 'Chybí autorizační kód. Zkuste prosím přihlášení znovu.'
      return
    }

    try {
      // Exchange the authorization code for tokens
      const response = await axios.post('/api/auth/google/callback', { code })

      // Set user state in store
      this.userStore.login(response.data.user, response.data.token)

      // Remove returnUrl from localStorage
      localStorage.removeItem('returnUrl')

      // Redirect to the return URL
      this.$router.push(returnUrl)
    } catch (error) {
      this.loading = false
      this.error = true

      console.error('Google authentication error:', error)

      if (error.response && error.response.data && error.response.data.error) {
        this.errorMessage = error.response.data.error
      } else {
        this.errorMessage =
          'Při přihlašování přes Google došlo k neočekávané chybě. Zkuste to prosím znovu.'
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
</style>
