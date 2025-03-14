webadmin@vm31309:~/apps/StavebninyWeb/BP-backend$ cat /home/webadmin/apps/StavebninyWeb/BP-backend/routes/authRoutes.js
// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Simplified login handler
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user directly via database query
    const queryResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = queryResult.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Neplatný e-mail nebo heslo' });
    }

    // Auto-verify the user if needed
    if (!user.is_verified) {
      await db.query('UPDATE users SET is_verified = true WHERE id = $1', [user.id]);
      console.log(`User ${email} automatically verified`);
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Neplatný e-mail nebo heslo' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return response
    res.status(200).json({
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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Při přihlašování došlo k chybě.' });
  }
});

// Add any other routes you need to bypass
router.post('/register', (req, res) => {
  res.status(400).json({ error: 'Registrace je dočasně nedostupná. Zkuste to později.' });
});

router.post('/forgot-password', (req, res) => {
  res.status(400).json({ error: 'Obnova hesla je dočasně nedostupná. Zkuste to později.' });
});

router.get('/verify-email/:token', (req, res) => {
  res.status(400).json({ error: 'Verifikace emailu je dočasně nedostupná. Zkuste to později.' });
});

module.exports = router;

