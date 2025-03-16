import API_URL from '@/config/api.js';
<template>
  <div class="HeadingStrip">
    <h1>Obnovení hesla</h1>
  </div>

  <div class="reset-container">
    <div class="reset-content">
      <div v-if="loading" class="loading">
        <p>Ověřování odkazu pro reset hesla...</p>
      </div>

      <div v-else-if="resetCompleted" class="success">
        <div class="success-icon">✓</div>
        <h2>Heslo bylo úspěšně změněno!</h2>
        <p>Nyní se můžete přihlásit do svého účtu s novým heslem.</p>
        <router-link to="/prihlaseni" class="button">Přejít na přihlášení</router-link>
      </div>

      <div v-else-if="tokenError" class="error">
        <div class="error-icon">✗</div>
        <h2>Neplatný odkaz</h2>
        <p>{{ errorMessage }}</p>
        <router-link to="/prihlaseni" class="link-button">Přejít na přihlášení</router-link>
        <router-link to="/forgot-password" class="button">Požádat znovu o reset hesla</router-link>
      </div>

      <div v-else class="reset-form-container">
        <h2>Nastavte si nové heslo</h2>
        <p class="intro-text">
          Zadejte své nové heslo níže. Doporučujeme použít silné heslo obsahující malá a velká
          písmena, číslice a speciální znaky.
        </p>

        <form @submit.prevent="submitResetPassword" class="reset-form">
          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

          <div class="form-group password-group">
            <label for="password">Nové heslo *</label>
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="resetData.password"
              required
              class="form-input"
              minlength="8"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
            <div class="field-hint">Minimálně 8 znaků</div>
          </div>

          <div class="form-group password-group">
            <label for="confirmPassword">Potvrzení hesla *</label>
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              id="confirmPassword"
              v-model="resetData.confirmPassword"
              required
              class="form-input"
              minlength="8"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>

          <div class="password-strength" v-if="resetData.password">
            <div class="strength-label">Síla hesla:</div>
            <div class="strength-meter">
              <div
                class="strength-value"
                :style="{
                  width: passwordStrength.percent + '%',
                  backgroundColor: passwordStrength.color
                }"
              ></div>
            </div>
            <div class="strength-text" :style="{ color: passwordStrength.color }">
              {{ passwordStrength.text }}
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-button" :disabled="isSubmitting || !isFormValid">
              <span v-if="!isSubmitting">Nastavit nové heslo</span>
              <span v-else>Zpracování...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ResetHesla',
  setup() {
    const router = useRouter()

    // State
    const resetData = ref({
      password: '',
      confirmPassword: ''
    })
    const token = ref('')
    const loading = ref(true)
    const resetCompleted = ref(false)
    const tokenError = ref(false)
    const errorMessage = ref('')
    const isSubmitting = ref(false)
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)

    // Password strength calculation
    const passwordStrength = computed(() => {
      const password = resetData.value.password
      if (!password) {
        return { percent: 0, color: '#ddd', text: '' }
      }

      // Basic strength check
      let strength = 0
      const checks = [
        password.length >= 8, // Length at least 8
        /[A-Z]/.test(password), // Has uppercase
        /[a-z]/.test(password), // Has lowercase
        /[0-9]/.test(password), // Has number
        /[^A-Za-z0-9]/.test(password), // Has special char
        password.length >= 12 // Extra length bonus
      ]

      strength = checks.filter(Boolean).length

      // Determine level
      let level = {
        percent: 0,
        color: '#ddd',
        text: 'Velmi slabé'
      }

      if (strength >= 1) {
        level = { percent: 20, color: '#e63946', text: 'Velmi slabé' }
      }
      if (strength >= 2) {
        level = { percent: 40, color: '#f5852a', text: 'Slabé' }
      }
      if (strength >= 3) {
        level = { percent: 60, color: '#f5a623', text: 'Střední' }
      }
      if (strength >= 4) {
        level = { percent: 80, color: '#8bc34a', text: 'Silné' }
      }
      if (strength >= 5) {
        level = { percent: 100, color: '#4caf50', text: 'Velmi silné' }
      }

      return level
    })

    // Form validation
    const isFormValid = computed(() => {
      return (
        resetData.value.password &&
        resetData.value.confirmPassword &&
        resetData.value.password === resetData.value.confirmPassword &&
        resetData.value.password.length >= 8
      )
    })

    // Check token validity
    const verifyToken = async () => {
      try {
        // Just check if token exists for now
        if (!token.value) {
          tokenError.value = true
          errorMessage.value = 'Chybí token pro reset hesla.'
          loading.value = false
          return
        }

        // In a real implementation, you might want to verify the token with the backend
        // const response = await axios.get(`/api/verify-reset-token/${token.value}`)

        // For now we'll just assume it's valid
        loading.value = false
      } catch (error) {
        tokenError.value = true
        loading.value = false

        if (error.response && error.response.data && error.response.data.error) {
          errorMessage.value = error.response.data.error
        } else {
          errorMessage.value = 'Odkaz pro obnovení hesla je neplatný nebo vypršel.'
        }
      }
    }

    // Submit new password
    const submitResetPassword = async () => {
      errorMessage.value = ''

      // Validate passwords match
      if (resetData.value.password !== resetData.value.confirmPassword) {
        errorMessage.value = 'Hesla se neshodují.'
        return
      }

      // Validate password length
      if (resetData.value.password.length < 8) {
        errorMessage.value = 'Heslo musí mít alespoň 8 znaků.'
        return
      }

      isSubmitting.value = true

      try {
        // Submit to backend
        const response = await axios.post(`/api/reset-password/${token.value}`, {
          password: resetData.value.password
        })

        resetCompleted.value = true
      } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage.value = error.response.data.error
        } else {
          errorMessage.value = 'Při resetování hesla došlo k chybě. Zkuste to prosím znovu.'
        }
      } finally {
        isSubmitting.value = false
      }
    }

    // On component mount
    onMounted(() => {
      token.value = router.currentRoute.value.params.token
      verifyToken()
    })

    return {
      resetData,
      loading,
      resetCompleted,
      tokenError,
      errorMessage,
      isSubmitting,
      showPassword,
      showConfirmPassword,
      passwordStrength,
      isFormValid,
      submitResetPassword
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

.reset-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.reset-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 30px;
}

.loading,
.success,
.error {
  text-align: center;
  padding: 30px;
}

.success-icon,
.error-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.success-icon {
  color: #4caf50;
}

.error-icon {
  color: #e63946;
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.intro-text {
  font-size: 16px;
  line-height: 1.6;
  color: #555;
  margin-bottom: 30px;
}

.reset-form-container {
  max-width: 500px;
  margin: 0 auto;
}

.reset-form {
  width: 100%;
}

.form-group {
  margin-bottom: 20px;
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

.field-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #777;
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

.password-strength {
  margin-bottom: 25px;
}

.strength-label {
  font-size: 14px;
  margin-bottom: 5px;
  color: #555;
}

.strength-meter {
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.strength-value {
  height: 100%;
  transition:
    width 0.3s,
    background-color 0.3s;
}

.strength-text {
  font-size: 12px;
  margin-top: 5px;
  font-weight: 500;
}

.form-actions {
  margin-top: 30px;
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

.submit-button:hover:not(:disabled) {
  background-color: #e67722;
}

.submit-button:disabled {
  background-color: #f8b47e;
  cursor: not-allowed;
}

.error-message {
  background-color: #ffebee;
  color: #e53935;
  padding: 12px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.button {
  display: inline-block;
  background-color: #f5852a;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
  margin-top: 20px;
}

.button:hover {
  background-color: #e67722;
}

.link-button {
  display: inline-block;
  margin-right: 15px;
  color: #555;
  text-decoration: underline;
  transition: color 0.3s;
}

.link-button:hover {
  color: #f5852a;
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

  .reset-content {
    padding: 20px;
  }
}

@media (max-width: 576px) {
  h1 {
    font-size: 28px;
    margin: 40px auto 30px auto;
  }

  .HeadingStrip {
    height: 100px;
  }
}
</style>
