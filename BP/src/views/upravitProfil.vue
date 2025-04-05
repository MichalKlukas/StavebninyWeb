<template>
  <div class="HeadingStrip">
    <h1>Úprava profilu</h1>
  </div>

  <div class="profile-container">
    <div class="profile-content">
      <!-- Použití komponenty bočního menu -->
      <ProfileSidebar active-section="profil" />

      <!-- Hlavní obsah - formulář pro úpravu profilu -->
      <div class="edit-profile-section">
        <h2>Úprava osobních údajů</h2>

        <form @submit.prevent="saveProfile" class="profile-form">
          <!-- Úspěšná zpráva -->
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <!-- Globální chybová zpráva -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div class="form-section">
            <h3>Osobní údaje</h3>

            <div class="form-row">
              <div class="form-group half">
                <label for="firstName">Jméno *</label>
                <input
                  type="text"
                  id="firstName"
                  v-model="profileData.firstName"
                  required
                  class="form-input"
                />
              </div>
              <div class="form-group half">
                <label for="lastName">Příjmení *</label>
                <input
                  type="text"
                  id="lastName"
                  v-model="profileData.lastName"
                  required
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label for="email">E-mail *</label>
                <input
                  type="email"
                  id="email"
                  v-model="profileData.email"
                  required
                  class="form-input"
                  disabled
                />
                <div class="field-hint">E-mail nelze změnit. Jedná se o Váš přihlašovací údaj.</div>
              </div>
              <div class="form-group half">
                <label for="phone">Telefon *</label>
                <input
                  type="tel"
                  id="phone"
                  v-model="profileData.phone"
                  required
                  class="form-input"
                  maxlength="20"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Fakturační adresa</h3>

            <div class="form-group">
              <label for="street">Ulice a číslo popisné</label>
              <input type="text" id="street" v-model="profileData.street" class="form-input" />
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label for="city">Město</label>
                <input type="text" id="city" v-model="profileData.city" class="form-input" />
              </div>
              <div class="form-group half">
                <label for="zipCode">PSČ</label>
                <input
                  type="text"
                  id="zipCode"
                  v-model="profileData.zipCode"
                  class="form-input"
                  maxlength="10"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Firemní údaje</h3>
            <div class="company-toggle">
              <input type="checkbox" id="isCompany" v-model="isCompany" class="toggle-checkbox" />
              <label for="isCompany" class="toggle-label">Chci nakupovat na firmu</label>
            </div>

            <div v-if="isCompany" class="company-fields">
              <div class="form-group">
                <label for="companyName">Název firmy *</label>
                <input
                  type="text"
                  id="companyName"
                  v-model="profileData.companyName"
                  :required="isCompany"
                  class="form-input"
                />
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label for="ico">IČO *</label>
                  <input
                    type="text"
                    id="ico"
                    v-model="profileData.ico"
                    :required="isCompany"
                    class="form-input"
                    maxlength="10"
                  />
                </div>
                <div class="form-group half">
                  <label for="dic">DIČ</label>
                  <input
                    type="text"
                    id="dic"
                    v-model="profileData.dic"
                    class="form-input"
                    maxlength="15"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-button" @click="cancelEdit">Zrušit</button>
            <button type="submit" class="submit-button" :disabled="isSubmitting">
              <span v-if="!isSubmitting">Uložit změny</span>
              <span v-else>Ukládání...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user' // Make sure this path is correct
import { useRouter } from 'vue-router'
import ProfileSidebar from '@/components/ProfileSidebar.vue'
import axios from 'axios'

export default {
  name: 'UpravitProfil',
  components: {
    ProfileSidebar
  },
  setup() {
    const userStore = useUserStore()
    const router = useRouter()

    // Bezpečnostní kontrola - přesměrování na přihlášení, pokud uživatel není přihlášen
    if (!userStore.isAuthenticated) {
      router.push('/prihlaseni')
      return {} // Early return if not authenticated
    }

    // Formulářová data
    const profileData = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      zipCode: '',
      companyName: '',
      ico: '',
      dic: ''
    })

    // Stav formuláře
    const isCompany = ref(false)
    const isSubmitting = ref(false)
    const successMessage = ref('')
    const errorMessage = ref('')

    // Debug funkce
    const logUserData = () => {
      console.log('Current user data in store:', userStore.user)
    }

    // Manually refresh user data if the method doesn't exist in the store
    const fetchUserData = async () => {
      try {
        // Check if refreshUserData exists in the store
        if (typeof userStore.refreshUserData === 'function') {
          console.log('Using store refreshUserData method')
          await userStore.refreshUserData()
        } else {
          console.log('Store refreshUserData not found, using manual fetch')
          // Manual fetch implementation
          const baseUrl = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'
          const token = localStorage.getItem('token')

          const response = await axios.get(`${baseUrl}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (response.data && response.data.user) {
            console.log('Got user data:', response.data.user)
            if (typeof userStore.setUser === 'function') {
              userStore.setUser(response.data.user)
            } else {
              // Direct assignment if setUser doesn't exist
              userStore.user = response.data.user

              // Manual mapping of fields
              if (response.data.user.first_name) {
                userStore.user.firstName = response.data.user.first_name
              }
              if (response.data.user.last_name) {
                userStore.user.lastName = response.data.user.last_name
              }
              if (response.data.user.zip_code) {
                userStore.user.zipCode = response.data.user.zip_code
              }
              if (response.data.user.company_name) {
                userStore.user.companyName = response.data.user.company_name
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    // Načtení dat uživatele
    onMounted(async () => {
      // First refresh user data
      await fetchUserData()

      // Log data for debugging
      logUserData()

      if (userStore.user) {
        const user = userStore.user

        // Careful mapping of fields - prefer camelCase if available for UI consistency
        profileData.value = {
          firstName: user.firstName || user.first_name || '',
          lastName: user.lastName || user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          street: user.street || '',
          city: user.city || '',
          zipCode: user.zipCode || user.zip_code || '',
          companyName: user.companyName || user.company_name || '',
          ico: user.ico || '',
          dic: user.dic || ''
        }

        // Log loaded data for debugging
        console.log('Loaded profile data:', profileData.value)

        // Nastavení přepínače firemních údajů
        isCompany.value = !!(profileData.value.companyName || profileData.value.ico)
      }
    })

    // Funkce pro zrušení úprav
    const cancelEdit = () => {
      router.push('/profil')
    }

    // Funkce pro uložení profilu
    // Funkce pro uložení profilu - fixed to handle undefined result
    const saveProfile = async () => {
      errorMessage.value = ''
      successMessage.value = ''
      isSubmitting.value = true

      try {
        // Prepare data with correct field names for the API
        const updateData = {
          first_name: profileData.value.firstName,
          last_name: profileData.value.lastName,
          phone: profileData.value.phone,
          street: profileData.value.street || null,
          city: profileData.value.city || null,
          zip_code: profileData.value.zipCode || null
        }

        // Add company data if needed
        if (isCompany.value) {
          updateData.company_name = profileData.value.companyName || null
          updateData.ico = profileData.value.ico || null
          updateData.dic = profileData.value.dic || null
        } else {
          updateData.company_name = null
          updateData.ico = null
          updateData.dic = null
        }

        console.log('Sending update data to server:', updateData)

        // Direct API call without using store
        const baseUrl = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'
        const token = localStorage.getItem('token')

        console.log('Making API call to update profile')
        const response = await axios.put(`${baseUrl}/api/user/profile`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        })

        console.log('Profile update response:', response.data)

        // Direct success handling
        successMessage.value = response.data.message || 'Profil byl úspěšně aktualizován'

        // Update user data in store if possible
        // Update user data in store if possible
        if (response.data && response.data.user) {
          if (userStore.user) {
            userStore.user = {
              ...userStore.user,
              ...response.data.user
            }

            // Manual mapping for component compatibility
            if (response.data.user.first_name)
              userStore.user.firstName = response.data.user.first_name
            if (response.data.user.last_name) userStore.user.lastName = response.data.user.last_name
            if (response.data.user.zip_code) userStore.user.zipCode = response.data.user.zip_code
            if (response.data.user.company_name)
              userStore.user.companyName = response.data.user.company_name
          }
        }

        console.log('User data after update:', userStore.user)

        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/profil'
        }, 1500)
      } catch (error) {
        console.error('Error updating profile:', error)
        errorMessage.value =
          error.response?.data?.error ||
          'Došlo k chybě při ukládání profilu. Zkuste to prosím znovu.'
      } finally {
        isSubmitting.value = false
      }
    }

    return {
      profileData,
      isCompany,
      isSubmitting,
      successMessage,
      errorMessage,
      cancelEdit,
      saveProfile
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
.edit-profile-section {
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
  margin: 0 0 15px 0;
}

/* Formulář */
.profile-form {
  max-width: 800px;
}

.form-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.form-group {
  margin-bottom: 20px;
  width: 100%;
}

.half {
  flex: 1 1 calc(50% - 10px);
  min-width: 250px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 10px 15px;
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

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.field-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #777;
}

/* Přepínač firemních údajů */
.company-toggle {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.toggle-checkbox {
  margin-right: 10px;
  transform: scale(1.2);
}

.toggle-label {
  font-weight: 500;
  color: #333;
  cursor: pointer;
}

.company-fields {
  padding-top: 5px;
}

/* Zprávy */
.success-message {
  background-color: #f0f8e5;
  color: #4caf50;
  padding: 12px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.error-message {
  background-color: #ffebee;
  color: #e53935;
  padding: 12px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

/* Tlačítka */
.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.submit-button,
.cancel-button {
  padding: 12px 20px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 150px;
}

.submit-button {
  background-color: #f5852a;
  color: white;
  border: none;
}

.cancel-button {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.submit-button:hover:not(:disabled) {
  background-color: #e67722;
}

.cancel-button:hover {
  background-color: #e0e0e0;
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

  .edit-profile-section {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .submit-button,
  .cancel-button {
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
