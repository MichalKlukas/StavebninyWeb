// Proxy serverless function with improved error handling
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Serverless: Received Google callback request')
    console.log('Request body:', JSON.stringify(req.body))

    // Check if code is present
    if (!req.body.code) {
      console.error('Serverless: No authorization code provided')
      return res.status(400).json({ error: 'No authorization code provided' })
    }

    // Forward the request to your actual backend
    const backendUrl = 'https://stavebninylysa.cz/api/auth/google/callback'
    console.log('Serverless: Forwarding to backend at:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    })

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Serverless: Backend returned error ${response.status}:`, errorText)
      return res.status(response.status).json({
        error: 'Backend API error',
        status: response.status,
        details: errorText
      })
    }

    // Get the response data
    const data = await response.json()
    console.log('Serverless: Response from backend received successfully')

    // Return the same status and data that your backend returned
    return res.status(200).json(data)
  } catch (error) {
    console.error('Serverless: Exception caught:', error.message)
    console.error('Serverless: Error stack:', error.stack)

    return res.status(500).json({
      error: 'Při přihlašování přes Google došlo k chybě',
      details: error.message,
      suggestion: 'Backend server might be unavailable or CORS issue'
    })
  }
}
