// Mock Google auth callback - for testing until backend is available
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Mock serverless: Received Google callback request')

    // Log the authorization code
    const { code } = req.body
    console.log('Authorization code received:', code ? 'Yes' : 'No')

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' })
    }

    // Mock user data
    const mockUser = {
      id: 123,
      firstName: 'Testovací',
      lastName: 'Uživatel',
      email: 'test@example.com',
      phone: null,
      companyName: null
    }

    // Generate a mock token
    const mockToken = 'Bearer mock_jwt_token_' + Math.random().toString(36).substring(2)

    // Return successful response with mock data
    return res.status(200).json({
      user: mockUser,
      token: mockToken
    })
  } catch (error) {
    console.error('Mock serverless error:', error.message)
    return res.status(500).json({ error: 'Při přihlašování přes Google došlo k chybě' })
  }
}
