import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Login request received at Vercel endpoint');
    
    // Forward the request to your actual backend
    const backendResponse = await axios.post(
      'http://46.28.108.195:3000/api/login', 
      req.body,
      { 
        timeout: 10000,  // 10 second timeout
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Login successful, returning response');
    
    // Return the backend response
    return res.status(backendResponse.status).json(backendResponse.data);
  } catch (error) {
    console.error('Error in login API:', error.message);
    
    // Handle backend error responses
    if (error.response) {
      // The backend returned an error response
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Handle network errors
    if (error.request) {
      console.error('No response received from backend');
      return res.status(504).json({ error: 'Backend server not responding' });
    }
    
    // Handle other errors
    return res.status(500).json({ error: 'Error processing login request' });
  }
}
