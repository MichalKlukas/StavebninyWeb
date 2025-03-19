const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// Google OAuth callback handler
exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Autorizační kód nebyl poskytnut' });
    }
    
    // Get environment variables
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.FRONTEND_URL}/auth/google/callback`;
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    
    // Get access token
    const accessToken = tokenResponse.data.access_token;
    
    // Get user info using the access token
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const userInfo = userInfoResponse.data;
    console.log('Google user info:', userInfo);
    
    // Check if user exists in database by Google ID
    const existingUserByGoogleIdResult = await db.query(
      'SELECT * FROM users WHERE google_id = $1',
      [userInfo.id]
    );
    
    let user;
    
    if (existingUserByGoogleIdResult.rows.length > 0) {
      // User exists with this Google ID
      user = existingUserByGoogleIdResult.rows[0];
      console.log('User found by Google ID:', user.email);
    } else {
      // Check if user exists with this email
      const existingUserByEmailResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [userInfo.email]
      );
      
      if (existingUserByEmailResult.rows.length > 0) {
        // User exists with this email, update Google ID
        console.log('User found by email, updating Google ID:', userInfo.email);
        const updateUserResult = await db.query(
          'UPDATE users SET google_id = $1, is_verified = TRUE WHERE email = $2 RETURNING *',
          [userInfo.id, userInfo.email]
        );
        
        user = updateUserResult.rows[0];
      } else {
        // Create new user
        console.log('Creating new user from Google account:', userInfo.email);
        const newUserResult = await db.query(
          `INSERT INTO users 
          (first_name, last_name, email, google_id, is_verified, created_at, terms_accepted, privacy_accepted) 
          VALUES ($1, $2, $3, $4, TRUE, CURRENT_TIMESTAMP, TRUE, TRUE) 
          RETURNING *`,
          [
            userInfo.given_name || '',
            userInfo.family_name || '',
            userInfo.email,
            userInfo.id
          ]
        );
        
        user = newUserResult.rows[0];
      }
    }
    
    // Create JWT token
    const expiresIn = '30d'; // Use same as remember me option
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn }
    );
    
    console.log(`Google login successful for: ${user.email}`);
    
    // Return user data and token
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        companyName: user.company_name
      }
    });
    
  } catch (error) {
    console.error('Google OAuth Error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Při přihlašování přes Google došlo k chybě'
    });
  }
};
