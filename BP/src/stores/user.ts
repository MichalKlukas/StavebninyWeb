// stores/user.ts
import { defineStore } from 'pinia'
import axios from 'axios'

interface UserData {
  id?: number
  email?: string
  first_name?: string
  firstName?: string
  last_name?: string
  lastName?: string
  phone?: string
  street?: string | null
  city?: string | null
  zip_code?: string | null
  zipCode?: string | null
  company_name?: string | null
  companyName?: string | null
  ico?: string | null
  dic?: string | null
  is_verified?: boolean
}

interface UpdateProfileResult {
  success: boolean
  message: string | null
}

interface ProfileUpdateData {
  first_name: string
  last_name: string
  phone: string
  street: string | null
  city: string | null
  zip_code: string | null
  company_name: string | null
  ico: string | null
  dic: string | null
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as UserData | null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token && !!state.user
  },

  actions: {
    setUser(userData: UserData): void {
      console.log('Setting user data in store:', userData)
      this.user = userData

      // Map snake_case to camelCase for component compatibility
      if (userData) {
        if (userData.first_name) this.user!.firstName = userData.first_name
        if (userData.last_name) this.user!.lastName = userData.last_name
        if (userData.zip_code) this.user!.zipCode = userData.zip_code
        if (userData.company_name) this.user!.companyName = userData.company_name
      }

      console.log('User data after mapping:', this.user)
    },

    setToken(token: string | null): void {
      this.token = token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },

    async logout(): Promise<void> {
      this.user = null
      this.setToken(null)
    },

    // Profile update method
    async updateProfile(profileData: ProfileUpdateData): Promise<UpdateProfileResult> {
      try {
        this.loading = true
        this.error = null

        const baseUrl = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'

        console.log('Sending profile update to API:', profileData)

        const response = await axios.put(`${baseUrl}/api/user/profile`, profileData, {
          headers: { Authorization: `Bearer ${this.token}` }
        })

        console.log('Profile update response:', response.data)

        if (response.data && response.data.user) {
          // Update the user in store
          this.setUser({
            ...(this.user || {}),
            ...response.data.user
          })

          return { success: true, message: response.data.message }
        }

        return {
          success: false,
          message: 'Profil byl aktualizován, ale došlo k chybě při obnovení dat.'
        }
      } catch (error: any) {
        console.error('Error updating profile in store:', error)
        this.error = error.response?.data?.error || 'Došlo k chybě při aktualizaci profilu.'
        return { success: false, message: this.error || 'Neznámá chyba' }
      } finally {
        this.loading = false
      }
    },

    // Refresh user data method
    async refreshUserData(): Promise<boolean> {
      try {
        this.loading = true
        this.error = null

        const baseUrl = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'

        console.log('Refreshing user data from API')

        const response = await axios.get(`${baseUrl}/api/user/profile`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })

        console.log('Get profile response:', response.data)

        if (response.data && response.data.user) {
          this.setUser(response.data.user)
          return true
        }
        return false
      } catch (error: any) {
        console.error('Error refreshing user data:', error)
        this.error = 'Nepovedlo se obnovit uživatelská data.'
        return false
      } finally {
        this.loading = false
      }
    }
  }
})
