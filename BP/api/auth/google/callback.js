// Proxy serverless function that forwards requests to your backend API
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Vercel serverless: Received Google callback, forwarding to backend')

    // Forward the request to your actual backend
    const response = await fetch('https://stavebninylysa.cz/api/auth/google/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    })

    // Get the response data
    const data = await response.json()

    console.log('Vercel serverless: Response from backend received')

    // Return the same status and data that your backend returned
    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Vercel serverless: Error communicating with backend:', error)
    return res.status(500).json({
      error: 'Při přihlašování přes Google došlo k chybě',
      details: 'Could not connect to backend API'
    })
  }
}
