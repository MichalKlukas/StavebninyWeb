// Simple mock login service for demonstration
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  
  // Hard-coded credentials for testing
  // In a real app, we would never do this - this is only a temporary solution!
  const validCredentials = {
    "michalik123456789@seznam.cz": "BoUrUhKy6914"
  };
  
  // Check if email exists and password matches
  if (validCredentials[email] && validCredentials[email] === password) {
    // Return successful login response
    return res.status(200).json({
      token: "mock-jwt-token-" + Date.now(),
      user: {
        id: 2,
        firstName: "Michal",
        lastName: "Klukas",
        email: email,
        phone: "733542837",
        companyName: "metaxa"
      }
    });
  }
  
  // Return error for invalid credentials
  return res.status(401).json({ error: 'Neplatný e-mail nebo heslo' });
}
