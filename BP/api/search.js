// File: /api/search.js
import axios from 'axios'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get search query from URL parameters
  const { q } = req.query

  if (!q) {
    return res.status(400).json({ error: 'Search query is required' })
  }

  const BACKEND_URL = process.env.BACKEND_URL || 'https://api.stavebninylysa.cz'

  try {
    console.log(`Searching for: ${q}`)

    // Forward the search request to your backend
    const backendResponse = await axios.get(
      `${BACKEND_URL}/api/products/search?q=${encodeURIComponent(q)}`,
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    )

    return res.status(backendResponse.status).json(backendResponse.data)
  } catch (error) {
    console.error('Error in search proxy:', error.message)

    if (error.response) {
      return res.status(error.response.status).json(error.response.data)
    }

    return res.status(502).json({
      error: 'Could not connect to backend server',
      details: error.message
    })
  }
}
