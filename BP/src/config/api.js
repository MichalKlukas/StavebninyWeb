// src/config/api.js
import axios from 'axios'

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout
  withCredentials: true // Include credentials
})

// Add request interceptor to set auth token and ensure API prefix
api.interceptors.request.use(
  (config) => {
    // Debug log
    console.log('[API] Request URL:', config.baseURL + config.url)

    // Add /api prefix if not present and not an absolute URL
    if (!config.url.startsWith('/api') && !config.url.startsWith('http')) {
      config.url = `/api${config.url}`
      console.log('[API] Added /api prefix to URL:', config.url)
    }

    // Extract token from localStorage
    const token = localStorage.getItem('token')

    if (token) {
      // Fix the potential Bearer duplication issues
      let tokenValue
      if (token.startsWith('Bearer ')) {
        tokenValue = token
      } else {
        tokenValue = `Bearer ${token}`
      }

      // Set Authorization header
      config.headers.Authorization = tokenValue
      console.log('[API] Added auth token to request')
    } else {
      console.log('[API] No auth token available for request')
    }

    return config
  },
  (error) => {
    console.error('[API] Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, response.status)
    return response
  },
  (error) => {
    // Log error details
    console.error('[API] Request failed:', error.config?.url || 'unknown endpoint')

    if (error.response) {
      console.error('[API] Status:', error.response.status)
      console.error('[API] Data:', error.response.data)

      // Handle authentication errors
      if (error.response.status === 401) {
        console.error('[API] Authentication error - consider redirecting to login')

        // Clear token if it's invalid/expired
        if (
          error.response.data &&
          (error.response.data.error === 'Invalid token. Please log in again.' ||
            error.response.data.error === 'Session expired. Please log in again.')
        ) {
          console.log('[API] Clearing invalid token from localStorage')
          localStorage.removeItem('token')
          localStorage.removeItem('user')

          // You might want to redirect to login page or dispatch a logout action
          // window.location.href = '/prihlaseni'
        }
      }
    } else if (error.request) {
      console.error('[API] No response received')
    } else {
      console.error('[API] Error details:', error.message)
    }

    return Promise.reject(error)
  }
)

// Export API_URL and api instance
export { API_URL }
export default api
