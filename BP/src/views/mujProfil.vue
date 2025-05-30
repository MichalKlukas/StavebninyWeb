<template>
  <div class="HeadingStrip">
    <h1>Můj profil</h1>
  </div>

  <div class="profile-container">
    <div class="profile-content">
      <!-- Použití komponenty bočního menu -->
      <ProfileSidebar active-section="profil" />

      <!-- Hlavní obsah - osobní údaje -->
      <div class="user-info-section">
        <h2>Osobní údaje</h2>
        <div v-if="loading" class="loading-state">Načítání...</div>
        <div v-else class="info-card">
          <div class="info-row">
            <div class="info-label">Jméno a příjmení:</div>
            <div class="info-value">{{ getUserFirstName() }} {{ getUserLastName() }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">E-mail:</div>
            <div class="info-value">{{ userStore.user?.email || 'Nenalezeno' }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Telefon:</div>
            <div class="info-value">{{ userStore.user?.phone || 'Nevyplněno' }}</div>
          </div>

          <div class="info-section">
            <h3>Fakturační adresa</h3>
            <div v-if="hasAddress" class="address-info">
              <div class="info-row">
                <div class="info-label">Ulice a č.p.:</div>
                <div class="info-value">{{ userStore.user?.street || 'Nevyplněno' }}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Město:</div>
                <div class="info-value">{{ userStore.user?.city || 'Nevyplněno' }}</div>
              </div>
              <div class="info-row">
                <div class="info-label">PSČ:</div>
                <div class="info-value">
                  {{ getUserZipCode() || 'Nevyplněno' }}
                </div>
              </div>
            </div>
            <div v-else class="no-address">
              <p>Nemáte vyplněnou adresu</p>
            </div>
          </div>

          <div v-if="hasCompanyInfo" class="info-section">
            <h3>Firemní údaje</h3>
            <div class="info-row">
              <div class="info-label">Název firmy:</div>
              <div class="info-value">
                {{ getUserCompanyName() || 'Nevyplněno' }}
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">IČO:</div>
              <div class="info-value">{{ userStore.user?.ico || 'Nevyplněno' }}</div>
            </div>
            <div class="info-row">
              <div class="info-label">DIČ:</div>
              <div class="info-value">{{ userStore.user?.dic || 'Nevyplněno' }}</div>
            </div>
          </div>

          <div class="actions">
            <button class="edit-button" @click="editProfile">Upravit údaje</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '../stores/user' // Make sure this path is correct
import { useRouter } from 'vue-router'
import ProfileSidebar from '@/components/ProfileSidebar.vue'
import axios from 'axios'

export default {
  name: 'MujProfil',
  components: {
    ProfileSidebar
  },
  setup() {
    const userStore = useUserStore()
    const router = useRouter()
    const loading = ref(true)

    // Bezpečnostní kontrola - přesměrování na přihlášení, pokud uživatel není přihlášen
    if (!userStore.isAuthenticated) {
      router.push('/prihlaseni')
      return { loading } // Early return if not authenticated
    }

    // Helper methods to get user data safely
    const getUserFirstName = () => {
      return userStore.user?.firstName || userStore.user?.first_name || 'Nevyplněno'
    }

    const getUserLastName = () => {
      return userStore.user?.lastName || userStore.user?.last_name || 'Nevyplněno'
    }

    const getUserZipCode = () => {
      return userStore.user?.zipCode || userStore.user?.zip_code || ''
    }

    const getUserCompanyName = () => {
      return userStore.user?.companyName || userStore.user?.company_name || ''
    }

    // Manual user data fetch function
    const fetchUserData = async () => {
      try {
        loading.value = true

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
      } finally {
        loading.value = false
      }
    }

    // Refresh user data when component mounts
    onMounted(async () => {
      await fetchUserData()
      console.log('User data in profile view:', userStore.user)
    })

    // Kontrola, zda má uživatel vyplněnou alespoň částečnou adresu
    const hasAddress = computed(() => {
      const user = userStore.user || {}
      return !!(user.street || user.city || user.zip_code || user.zipCode)
    })

    // Kontrola, zda má uživatel vyplněné firemní údaje
    const hasCompanyInfo = computed(() => {
      const user = userStore.user || {}
      return !!(user.company_name || user.companyName || user.ico || user.dic)
    })

    // Metody
    const editProfile = () => {
      router.push('/upravit-profil')
    }

    return {
      userStore,
      loading,
      hasAddress,
      hasCompanyInfo,
      editProfile,
      getUserFirstName,
      getUserLastName,
      getUserZipCode,
      getUserCompanyName
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
.loading-state {
  text-align: center;
  padding: 20px;
  color: #777;
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
.user-info-section {
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

.info-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
  padding: 25px;
}

.info-section {
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.info-row {
  display: flex;
  margin-bottom: 15px;
}

.info-label {
  flex: 0 0 150px;
  font-weight: bold;
  color: #555;
}

.info-value {
  flex: 1;
  color: #333;
}

.no-address {
  color: #757575;
  font-style: italic;
  padding: 5px 0;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}

.edit-button {
  padding: 10px 20px;
  background-color: #f5852a;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.edit-button:hover {
  background-color: #e67722;
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

  .info-row {
    flex-direction: column;
  }

  .info-label {
    margin-bottom: 5px;
  }

  .actions {
    flex-direction: column;
  }

  .edit-button {
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
