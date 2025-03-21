<!-- src/views/prihlaseni.vue -->
<template>
  <div class="HeadingStrip">
    <h1>Přihlášení</h1>
  </div>
  <div class="login-container">
    <div class="login-content">
      <p class="intro-text">
        Pro přístup k vašemu účtu se prosím přihlaste. Pokud ještě nemáte vytvořený účet, můžete se
        zaregistrovat pomocí tlačítka níže.
      </p>

      <div class="login-options">
        <!-- Main login form -->
        <form @submit.prevent="submitLogin" class="login-form" v-if="!formSubmitted">
          <div class="form-group">
            <label for="email">E-mail *</label>
            <input
              type="email"
              id="email"
              v-model="loginData.email"
              required
              class="form-input"
              placeholder="váš@email.cz"
            />
          </div>

          <div class="form-group password-group">
            <label for="password">Heslo *</label>
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="loginData.password"
              required
              class="form-input"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>

          <div class="form-group checkbox-group">
            <div class="checkbox-wrapper">
              <input type="checkbox" id="remember" v-model="loginData.remember" />
              <label for="remember">Zapamatovat přihlášení</label>
            </div>
          </div>

          <div class="form-group">
            <button type="submit" class="submit-button" :disabled="isSubmitting">
              <span v-if="!isSubmitting">Přihlásit se</span>
              <span v-else>Přihlašování...</span>
            </button>
          </div>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

          <div class="form-links">
            <a href="#" @click.prevent="showForgotPassword = true" class="forgot-link"
              >Zapomenuté heslo?</a
            >
          </div>
        </form>

        <!-- Password reset form -->
        <form @submit.prevent="submitForgotPassword" class="forgot-form" v-if="showForgotPassword">
          <h3>Obnovení hesla</h3>
          <p>Zadejte svůj e-mail a my vám zašleme odkaz pro obnovení hesla.</p>

          <div class="form-group">
            <label for="forgot-email">E-mail *</label>
            <input
              type="email"
              id="forgot-email"
              v-model="forgotData.email"
              required
              class="form-input"
            />
          </div>

          <div class="form-group buttons-row">
            <button type="button" @click="showForgotPassword = false" class="back-button">
              Zpět
            </button>
            <button type="submit" class="submit-button" :disabled="isSubmitting">
              <span v-if="!isSubmitting">Odeslat</span>
              <span v-else>Odesílání...</span>
            </button>
          </div>

          <p v-if="forgotSuccessMessage" class="success-message">{{ forgotSuccessMessage }}</p>
          <p v-if="forgotErrorMessage" class="error-message">{{ forgotErrorMessage }}</p>
        </form>

        <!-- Separator for social login -->
        <div class="social-separator" v-if="!showForgotPassword && !formSubmitted">
          <span>nebo</span>
        </div>

        <!-- Google login button -->
        <div class="social-login" v-if="!showForgotPassword && !formSubmitted">
          <button @click="loginWithGoogle" class="google-button" :disabled="isSubmitting">
            <span class="google-icon">G</span>
            <span>Přihlásit přes Google</span>
          </button>
        </div>

        <!-- Login success message -->
        <div v-if="formSubmitted" class="success-message">
          <div class="success-content">
            <h3>Úspěšně jste se přihlásili!</h3>
            <p>Nyní budete přesměrováni do vašeho účtu.</p>
          </div>
        </div>
      </div>

      <!-- Registration section -->
      <div class="register-section" v-if="!showForgotPassword && !formSubmitted">
        <h3>Ještě nemáte účet?</h3>
        <p>
          Vytvořte si účet a získejte přístup k historii objednávek, sledování zásilek a dalším
          výhodám.
        </p>
        <router-link to="/registrace" class="register-button"> Registrovat se </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/useUserStore'
import { useCartStore } from '../stores/cartStore'

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const userStore = useUserStore()
    const cartStore = useCartStore()

    // Form data
    const loginData = ref({
      email: '',
      password: '',
      remember: false
    })

    const forgotData = ref({
      email: ''
    })

    // UI state
    const isSubmitting = ref(false)
    const formSubmitted = ref(false)
    const errorMessage = ref('')
    const forgotErrorMessage = ref('')
    const forgotSuccessMessage = ref('')
    const showPassword = ref(false)
    const showForgotPassword = ref(false)

    // Handle regular login
    const submitLogin = async () => {
      isSubmitting.value = true
      errorMessage.value = ''

      try {
        console.log('[Login] Attempting login with email:', loginData.value.email)
        const response = await axios.post('/api/login', loginData.value)

        console.log('[Login] Login successful, user:', response.data.user.email)

        // Set user in store
        await userStore.login(response.data.user, response.data.token)

        // Once logged in, merge the cart
        console.log('[Login] Initializing cart after login')
        await cartStore.handleLogin()

        // Show success message
        formSubmitted.value = true

        // Redirect after delay
        setTimeout(() => {
          const returnUrl = route.query.returnUrl || '/'
          router.push(returnUrl)
        }, 1500)
      } catch (error) {
        console.error('[Login] Login error:', error)

        if (error.response && error.response.data && error.response.data.error) {
          errorMessage.value = error.response.data.error
        } else {
          errorMessage.value =
            'Nepodařilo se přihlásit. Zkontrolujte své přihlašovací údaje a zkuste to znovu.'
        }
      } finally {
        isSubmitting.value = false
      }
    }

    // Handle password reset request
    const submitForgotPassword = async () => {
      isSubmitting.value = true
      forgotErrorMessage.value = ''
      forgotSuccessMessage.value = ''

      try {
        const response = await axios.post('/api/forgot-password', {
          email: forgotData.value.email
        })

        forgotSuccessMessage.value = 'Instrukce pro obnovení hesla byly odeslány na váš e-mail.'

        // Switch back to login form after delay
        setTimeout(() => {
          showForgotPassword.value = false
          forgotData.value.email = ''
          forgotSuccessMessage.value = ''
        }, 3000)
      } catch (error) {
        console.error('[Login] Password reset error:', error)

        if (error.response && error.response.data && error.response.data.error) {
          forgotErrorMessage.value = error.response.data.error
        } else {
          forgotErrorMessage.value =
            'Při odesílání požadavku došlo k chybě. Zkuste to prosím znovu později.'
        }
      } finally {
        isSubmitting.value = false
      }
    }

    // Handle Google login
    const loginWithGoogle = () => {
      // Prevent multiple clicks
      if (isSubmitting.value) return
      isSubmitting.value = true

      try {
        console.log('[Login] Starting Google login flow')

        // Get Google client ID from environment
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
        console.log('[Login] Client ID available:', !!clientId)

        if (!clientId) {
          errorMessage.value = 'Chyba konfigurace Google přihlášení. Kontaktujte prosím správce.'
          isSubmitting.value = false
          return
        }

        // Create redirect URI
        const redirectUri = `${window.location.origin}/auth/google/callback`

        // Store return URL for after login
        const returnUrl = route.query.returnUrl || '/'
        localStorage.setItem('returnUrl', returnUrl)

        // Build Google OAuth URL
        const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
        const scope = 'profile email'

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope,
          access_type: 'offline',
          prompt: 'consent'
        })

        console.log('[Login] Redirecting to Google authentication')

        // Redirect to Google authentication
        window.location.href = `${googleAuthUrl}?${params.toString()}`
      } catch (error) {
        console.error('[Login] Error initiating Google login:', error)
        errorMessage.value = 'Při přihlašování přes Google došlo k chybě.'
        isSubmitting.value = false
      }
    }

    return {
      loginData,
      forgotData,
      isSubmitting,
      formSubmitted,
      errorMessage,
      forgotErrorMessage,
      forgotSuccessMessage,
      showPassword,
      showForgotPassword,
      submitLogin,
      submitForgotPassword,
      loginWithGoogle
    }
  }
}
</script>

<style scoped>
.HeadingStrip {
  width: 100%;
  height: 150px;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
}

h1 {
  color: #0e0e0e;
  margin: 100px auto 80px auto;
  text-align: center;
  font-size: 42px;
}

.login-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.login-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 30px;
}

.intro-text {
  font-size: 18px;
  line-height: 1.6;
  color: #555;
  margin-bottom: 30px;
  text-align: center;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.login-options {
  max-width: 500px;
  margin: 0 auto 40px;
}

.login-form,
.forgot-form {
  width: 100%;
}

.form-group {
  margin-bottom: 20px;
}

.buttons-row {
  display: flex;
  gap: 15px;
}

.buttons-row button {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #f5852a;
  box-shadow: 0 0 0 2px rgba(245, 133, 42, 0.2);
}

.password-group {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 15px;
  top: 38px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #777;
}

.checkbox-group {
  margin-top: 5px;
  margin-bottom: 25px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
}

.checkbox-wrapper input[type='checkbox'] {
  margin-right: 10px;
}

.checkbox-wrapper label {
  font-weight: normal;
  margin-bottom: 0;
  font-size: 14px;
  color: #555;
}

.submit-button {
  background-color: #f5852a;
  color: white;
  border: none;
  padding: 14px 30px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
}

.submit-button:hover {
  background-color: #e67722;
}

.submit-button:disabled {
  background-color: #f8b47e;
  cursor: not-allowed;
}

.back-button {
  background-color: #555;
  color: white;
  border: none;
  padding: 14px 30px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #333;
}

.form-links {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
}

.forgot-link {
  color: #555;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #f5852a;
  text-decoration: underline;
}

.error-message {
  color: #e63946;
  text-align: center;
  margin-top: 15px;
  font-weight: 500;
}

.success-message {
  color: #4caf50;
  text-align: center;
  margin-top: 15px;
  font-weight: 500;
}

.social-separator {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 25px 0;
  color: #777;
}

.social-separator::before,
.social-separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.social-separator span {
  padding: 0 10px;
}

.social-login {
  margin-bottom: 25px;
}

.google-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  color: #555;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.3s,
    border-color 0.3s;
}

.google-button:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.google-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  background-color: #fff;
  color: #4285f4;
  font-weight: bold;
  font-size: 18px;
  margin-right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.register-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #eee;
  text-align: center;
}

.register-section h3 {
  font-size: 22px;
  margin-bottom: 15px;
  color: #333;
}

.register-section p {
  color: #555;
  margin-bottom: 25px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.register-button {
  display: inline-block;
  background-color: #555;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.register-button:hover {
  background-color: #333;
}

.success-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 30px;
  background-color: #f0f8e5;
  border-radius: 8px;
  text-align: center;
}

.success-content h3 {
  color: #4caf50;
  font-size: 24px;
  margin-bottom: 15px;
}

.success-content p {
  margin-bottom: 0;
  font-size: 16px;
  line-height: 1.6;
}

/* Responsive design */
@media (max-width: 768px) {
  h1 {
    font-size: 32px;
    margin: 60px auto 40px auto;
  }

  .HeadingStrip {
    height: 120px;
  }
}

@media (max-width: 576px) {
  .login-content {
    padding: 20px;
  }

  .intro-text {
    font-size: 16px;
  }

  h1 {
    font-size: 28px;
    margin: 40px auto 30px auto;
  }

  .HeadingStrip {
    height: 100px;
  }
}
</style>
