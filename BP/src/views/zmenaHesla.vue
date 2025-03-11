import API_URL from '@/config/api.js';
<template>
  <div class="HeadingStrip">
    <h1>Změna hesla</h1>
  </div>

  <div class="profile-container">
    <div class="profile-content">
      <!-- Použití komponenty bočního menu -->
      <ProfileSidebar active-section="heslo" />

      <!-- Hlavní obsah - formulář pro změnu hesla -->
      <div class="password-change-section">
        <h2>Změna hesla</h2>

        <!-- Úspěšná změna hesla -->
        <div v-if="passwordChanged" class="success-message">
          <div class="success-icon">✓</div>
          <h3>Heslo bylo úspěšně změněno</h3>
          <p>Vaše heslo bylo úspěšně aktualizováno. Při příštím přihlášení použijte nové heslo.</p>
        </div>

        <!-- Formulář pro změnu hesla -->
        <form v-else @submit.prevent="changePassword" class="password-form">
          <div class="form-message">
            <p>Pro změnu hesla zadejte vaše současné heslo a poté nové heslo.</p>
          </div>

          <!-- Současné heslo -->
          <div class="form-group">
            <label for="currentPassword">Současné heslo *</label>
            <div class="password-input-wrapper">
              <input
                :type="showCurrentPassword ? 'text' : 'password'"
                id="currentPassword"
                v-model="passwordData.currentPassword"
                required
                class="form-input"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showCurrentPassword = !showCurrentPassword"
              >
                {{ showCurrentPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <div v-if="errors.currentPassword" class="error-text">
              {{ errors.currentPassword }}
            </div>
          </div>

          <!-- Nové heslo -->
          <div class="form-group">
            <label for="newPassword">Nové heslo *</label>
            <div class="password-input-wrapper">
              <input
                :type="showNewPassword ? 'text' : 'password'"
                id="newPassword"
                v-model="passwordData.newPassword"
                required
                class="form-input"
                @input="validatePassword"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showNewPassword = !showNewPassword"
              >
                {{ showNewPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <div v-if="passwordData.newPassword" class="password-strength">
              <div class="strength-meter">
                <div
                  class="strength-value"
                  :style="{ width: passwordStrength + '%', backgroundColor: strengthColor }"
                ></div>
              </div>
              <span class="strength-text">{{ strengthText }}</span>
            </div>
            <div class="password-hint">
              Heslo musí obsahovat minimálně 8 znaků, včetně alespoň jednoho velkého písmena, malého
              písmena a číslice.
            </div>
            <div v-if="errors.newPassword" class="error-text">
              {{ errors.newPassword }}
            </div>
          </div>

          <!-- Potvrzení nového hesla -->
          <div class="form-group">
            <label for="confirmPassword">Potvrzení nového hesla *</label>
            <div class="password-input-wrapper">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                id="confirmPassword"
                v-model="passwordData.confirmPassword"
                required
                class="form-input"
                @input="validateConfirmPassword"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <div v-if="errors.confirmPassword" class="error-text">
              {{ errors.confirmPassword }}
            </div>
          </div>

          <!-- Globální chybová zpráva -->
          <div v-if="errors.general" class="general-error">
            {{ errors.general }}
          </div>

          <!-- Tlačítka -->
          <div class="form-actions">
            <button type="submit" class="submit-button" :disabled="isSubmitting || !isFormValid">
              <span v-if="!isSubmitting">Změnit heslo</span>
              <span v-else>Zpracování...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useUserStore } from '../stores'
import { useRouter } from 'vue-router'
import ProfileSidebar from '@/components/ProfileSidebar.vue'
import axios from 'axios'

export default {
  name: 'ZmenaHesla',
  components: {
    ProfileSidebar
  },
  setup() {
    const userStore = useUserStore()
    const router = useRouter()

    // Bezpečnostní kontrola - přesměrování na přihlášení, pokud uživatel není přihlášen
    if (!userStore.isAuthenticated) {
      router.push('/prihlaseni')
    }

    // Stav a proměnné
    const passwordData = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    const errors = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      general: ''
    })

    const showCurrentPassword = ref(false)
    const showNewPassword = ref(false)
    const showConfirmPassword = ref(false)
    const isSubmitting = ref(false)
    const passwordChanged = ref(false)

    // Validace hesla
    const validatePassword = () => {
      const password = passwordData.value.newPassword

      if (password.length < 8) {
        errors.value.newPassword = 'Heslo musí mít alespoň 8 znaků'
        return false
      }

      if (!/[A-Z]/.test(password)) {
        errors.value.newPassword = 'Heslo musí obsahovat alespoň jedno velké písmeno'
        return false
      }

      if (!/[a-z]/.test(password)) {
        errors.value.newPassword = 'Heslo musí obsahovat alespoň jedno malé písmeno'
        return false
      }

      if (!/\d/.test(password)) {
        errors.value.newPassword = 'Heslo musí obsahovat alespoň jednu číslici'
        return false
      }

      errors.value.newPassword = ''

      // Pokud už bylo vyplněno potvrzovací heslo, zkontroluj shodu
      if (passwordData.value.confirmPassword) {
        validateConfirmPassword()
      }

      return true
    }

    // Validace potvrzení hesla
    const validateConfirmPassword = () => {
      const { newPassword, confirmPassword } = passwordData.value

      if (newPassword !== confirmPassword) {
        errors.value.confirmPassword = 'Hesla se neshodují'
        return false
      }

      errors.value.confirmPassword = ''
      return true
    }

    // Výpočet síly hesla
    const passwordStrength = computed(() => {
      const password = passwordData.value.newPassword

      if (!password) return 0

      let strength = 0

      // Délka
      if (password.length >= 8) strength += 25

      // Malá písmena
      if (/[a-z]/.test(password)) strength += 25

      // Velká písmena
      if (/[A-Z]/.test(password)) strength += 25

      // Číslice
      if (/\d/.test(password)) strength += 25

      return strength
    })

    // Barva indikátoru síly hesla
    const strengthColor = computed(() => {
      const strength = passwordStrength.value

      if (strength < 50) return '#ff4d4d' // Červená
      if (strength < 75) return '#ffa64d' // Oranžová
      return '#4CAF50' // Zelená
    })

    // Text indikátoru síly hesla
    const strengthText = computed(() => {
      const strength = passwordStrength.value

      if (strength < 50) return 'Slabé'
      if (strength < 75) return 'Středně silné'
      return 'Silné'
    })

    // Validita formuláře
    const isFormValid = computed(() => {
      return (
        passwordData.value.currentPassword &&
        passwordData.value.newPassword &&
        passwordData.value.confirmPassword &&
        !errors.value.currentPassword &&
        !errors.value.newPassword &&
        !errors.value.confirmPassword
      )
    })

    // Změna hesla
    const changePassword = async () => {
      // Reset chybových zpráv
      errors.value.general = ''
      errors.value.currentPassword = ''

      if (!validatePassword() || !validateConfirmPassword()) {
        return
      }

      isSubmitting.value = true

      try {
        // Volání API pro změnu hesla
        await axios.post(
          '/api/change-password',
          {
            currentPassword: passwordData.value.currentPassword,
            newPassword: passwordData.value.newPassword
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        )

        // Úspěšná změna hesla
        passwordChanged.value = true

        // Reset formuláře
        passwordData.value = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      } catch (error) {
        console.error('Chyba při změně hesla:', error)

        if (error.response) {
          // Specifické chyby
          if (error.response.status === 401) {
            errors.value.currentPassword = 'Současné heslo není správné'
          } else if (error.response.data && error.response.data.error) {
            errors.value.general = error.response.data.error
          } else {
            errors.value.general = 'Došlo k chybě při změně hesla. Zkuste to prosím znovu.'
          }
        } else {
          errors.value.general = 'Nelze se připojit k serveru. Zkontrolujte připojení k internetu.'
        }
      } finally {
        isSubmitting.value = false
      }
    }

    return {
      passwordData,
      errors,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      isSubmitting,
      passwordChanged,
      passwordStrength,
      strengthColor,
      strengthText,
      isFormValid,
      validatePassword,
      validateConfirmPassword,
      changePassword
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

.profile-container {
  max-width: 1200px;
  margin: 0 auto 80px;
  padding: 0 20px;
  font-family: Arial, sans-serif;
}

.profile-content {
  display: flex;
  gap: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Hlavní obsah */
.password-change-section {
  flex: 1;
  padding: 30px;
}

h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

h3 {
  color: #555;
  font-size: 18px;
  margin: 15px 0 10px 0;
}

/* Úspěšná zpráva */
.success-message {
  background-color: #f0f8e5;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
}

.success-icon {
  font-size: 48px;
  color: #4caf50;
  margin-bottom: 15px;
}

/* Formulář */
.form-message {
  margin-bottom: 20px;
  color: #666;
}

.form-group {
  margin-bottom: 25px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.password-input-wrapper {
  position: relative;
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

.toggle-password {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #777;
}

/* Indikátor síly hesla */
.password-strength {
  margin-top: 10px;
}

.strength-meter {
  height: 5px;
  background-color: #eee;
  border-radius: 3px;
  margin-bottom: 5px;
}

.strength-value {
  height: 100%;
  border-radius: 3px;
  transition:
    width 0.3s,
    background-color 0.3s;
}

.strength-text {
  font-size: 12px;
  color: #777;
}

.password-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
}

/* Chybové zprávy */
.error-text {
  color: #e53935;
  font-size: 13px;
  margin-top: 5px;
}

.general-error {
  background-color: #ffebee;
  color: #e53935;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

/* Tlačítka */
.form-actions {
  margin-top: 30px;
}

.submit-button {
  padding: 12px 24px;
  background-color: #f5852a;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 200px;
}

.submit-button:hover:not(:disabled) {
  background-color: #e67722;
}

.submit-button:disabled {
  background-color: #f5ac73;
  cursor: not-allowed;
}

/* Responzivní design */
@media (max-width: 950px) {
  .profile-content {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  h1 {
    font-size: 32px;
    margin: 60px auto 40px auto;
  }

  .HeadingStrip {
    height: 120px;
  }

  .password-change-section {
    padding: 20px;
  }

  .submit-button {
    width: 100%;
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
