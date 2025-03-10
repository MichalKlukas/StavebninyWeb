// middleware/basicAuthMiddleware.js
const basicAuth = (req, res, next) => {

const API_USERNAME = process.env.DUNA_API_USERNAME;
const API_PASSWORD = process.env.DUNA_API_PASSWORD;
  
  // Získání autorizační hlavičky
  const authHeader = req.headers.authorization;
  
  // Kontrola existence hlavičky
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Chybí autentifikace');
  }
  
  // Dekódování a ověření přihlašovacích údajů
  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    if (username === API_USERNAME && password === API_PASSWORD) {
      return next();
    }
    
    // Nesprávné údaje
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Špatné přihlašovací jméno nebo heslo');
  } catch (error) {
    console.error('Chyba při zpracování autentizace:', error);
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Chyba autentizace');
  }
};

module.exports = basicAuth;