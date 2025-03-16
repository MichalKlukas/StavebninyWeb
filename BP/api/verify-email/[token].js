import axios from 'axios';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  const BACKEND_URL = process.env.BACKEND_URL || 'http://46.28.108.195:3000';
  
  try {
    console.log(`Verifying email token: ${token}`);
    const backendResponse = await axios.get(
      `${BACKEND_URL}/api/verify-email/${token}`,
      { 
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    return res.status(backendResponse.status).json(backendResponse.data);
  } catch (error) {
    console.error('Error in email verification proxy:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(502).json({ 
      error: 'Could not connect to backend server',
      details: error.message
    });
  }
}
