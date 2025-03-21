// src/config/api.js
import axios from 'axios'

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true // Include credentials
})

// Add request interceptor to set auth token and ensure API prefix
api.interceptors.request.use(
  (config) => {
    console.log('[API] Full request URL:', config.baseURL + config.url)
    console.log('[API] Headers:', config.headers)
    // Add /api prefix if not present and not an absolute URL
    if (!config.url.startsWith('/api') && !config.url.startsWith('http')) {
      config.url = `/api${config.url}`
      console.log('[API] Added /api prefix to URL:', config.url)
    }

    const token = localStorage.getItem('token')
    if (token) {
      // Fix the potential Bearer duplication by extracting just the token if needed
      const tokenValue = token.startsWith('Bearer ') ? token.substring(7) : token
      config.headers.Authorization = `Bearer ${tokenValue}`
      console.log('[API] Adding auth token to request:', config.url)
    } else {
      console.log('[API] No auth token available for request:', config.url)
    }
    return config
  },
  (error) => {
    console.error('[API] Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor remains the same
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
    } else if (error.request) {
      console.error('[API] No response received')
    } else {
      console.error('[API] Error details:', error.message)
    }

    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.error('[API] Authentication error - consider redirecting to login')
    }

    return Promise.reject(error)
  }
)

// Switch the exports to make api the default export
export { API_URL }
export default api
