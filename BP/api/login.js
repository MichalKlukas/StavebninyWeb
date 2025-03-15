// /api/login.js
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

  // Only allow POST method for actual login
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Login request received, forwarding to backend');
    
    // Forward to backend
    const backendResponse = await axios.post(
      'http://46.28.108.195:3000/api/login', 
      req.body,
      { 
        timeout: 10000,  // 10 second timeout
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Backend response received');
    
    // Return the backend response
    return res.status(backendResponse.status).json(backendResponse.data);
  } catch (error) {
    console.error('Error in login proxy:', error.message);
    
    // Handle backend error responses
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Handle network errors
    if (error.request) {
      return res.status(502).json({ 
        error: 'Could not connect to backend server',
        details: error.message
      });
    }
    
    // Handle other errors
    return res.status(500).json({ 
      error: 'Error processing request',
      details: error.message
    });
  }
}
