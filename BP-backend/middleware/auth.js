// BP-backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

console.log('Auth middleware loaded');

// Middleware for checking authentication
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return res.status(401).json({ error: 'Přístup odepřen. Přihlaste se prosím.' });
    }

    console.log('Auth header found, verifying token');
    const token = authHeader.replace('Bearer ', '');
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified for user ID:', decoded.id);
      
      // Load user
      const user = await userModel.findById(decoded.id);
      
      if (!user) {
        console.log('User not found:', decoded.id);
        return res.status(401).json({ error: 'Přístup odepřen. Uživatel nebyl nalezen.' });
      }
      
      // Check if account is verified
      if (!user.is_verified) {
        console.log('User not verified:', decoded.id);
        return res.status(401).json({
          error: 'Váš účet není ověřen. Zkontrolujte svůj e-mail a dokončete registraci.'
        });
      }
      
      // Add user to request
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      };
      
      console.log('Auth successful for user:', user.email);
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        console.log('Invalid token');
        return res.status(401).json({ error: 'Neplatný token. Přihlaste se prosím znovu.' });
      }
      if (error.name === 'TokenExpiredError') {
        console.log('Token expired');
        return res.status(401).json({ error: 'Platnost přihlášení vypršela. Přihlaste se prosím znovu.' });
      }
      
      console.error('Auth error:', error);
      res.status(500).json({ error: 'Při ověřování přihlášení došlo k chybě.' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Při ověřování přihlášení došlo k chybě.' });
  }
};

module.exports = auth;
