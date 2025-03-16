const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
console.log('Auth middleware loaded');
// Middleware pro kontrolu autentizace
const auth = async (req, res, next) => {
  try {
    // Získání tokenu z hlavičky
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Přístup odepřen. Přihlaste se prosím.' });
    }
console.log('Auth middleware executing');
console.log('Authorization header:', req.headers.authorization);
    const token = authHeader.replace('Bearer ', '');
    
    // Ověření JWT tokenu
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Načtení uživatele z databáze
    const user = await userModel.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Přístup odepřen. Uživatel nebyl nalezen.' });
    }
    
    // Kontrola, zda byl účet ověřen
    if (!user.is_verified) {
      return res.status(401).json({ 
        error: 'Váš účet není ověřen. Zkontrolujte svůj e-mail a dokončete registraci.' 
      });
    }
    
    // Přidání uživatele do požadavku pro další použití
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Neplatný token. Přihlaste se prosím znovu.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Platnost přihlášení vypršela. Přihlaste se prosím znovu.' });
    }
    
    console.error('Chyba autentizace:', error);
    res.status(500).json({ error: 'Při ověřování přihlášení došlo k chybě.' });
  }
};

module.exports = auth;
