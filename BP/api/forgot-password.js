import axios from 'axios'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const BACKEND_URL = process.env.BACKEND_URL || 'https://api.stavebninylysa.cz'

  try {
    console.log('Forgot password request received, forwarding to backend')
    const backendResponse = await axios.post(`${BACKEND_URL}/api/forgot-password`, req.body, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    })

    return res.status(backendResponse.status).json(backendResponse.data)
  } catch (error) {
    console.error('Error in forgot password proxy:', error.message)

    if (error.response) {
      return res.status(error.response.status).json(error.response.data)
    }

    return res.status(502).json({
      error: 'Could not connect to backend server',
      details: error.message
    })
  }
}
