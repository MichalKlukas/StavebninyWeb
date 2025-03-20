// src/config/api.js
import axios from 'axios'

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true // Include credentials
})

// Add request interceptor to set auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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

// Add response interceptor to handle errors consistently
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
      // You could add code here to redirect to login or clear user session
    }

    return Promise.reject(error)
  }
)

export { api }
export default API_URL
