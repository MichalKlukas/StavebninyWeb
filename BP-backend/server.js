// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

// Import additional routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const dunaApiRoutes = require('./routes/dunaApiRoutes');
const cartRoutes = require('./routes/cartRoutes'); // Contains shipping route

// Load environment variables
dotenv.config();
console.log('Node environment:', process.env.NODE_ENV);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS configuration
const corsOptions = {
  origin: 'https://stavebniny-web.vercel.app', // or array/function if you need multiple
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// 2. Use CORS for all routes
app.use(cors(corsOptions));

// 3. Explicitly allow OPTIONS for all routes
app.options('*', cors(corsOptions));

// Middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('Request body:', req.body);
  }
  next();
});

// Debug endpoints
app.get('/debug-hello', (req, res) => {
  console.log('Debug hello endpoint accessed');
  res.json({ message: 'Hello from server!' });
});

app.get('/debug-user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    console.log(`Checking debug info for user: ${email}`);

    const result = await db.query(
      'SELECT id, email, is_verified, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ exists: false, message: "User not found in database" });
    }

    const user = result.rows[0];
    res.json({
      exists: true,
      id: user.id,
      email: user.email,
      is_verified: user.is_verified,
      has_password: !!user.password_hash
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Error checking user' });
  }
});

app.post('/debug-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Debug login attempt for: ${email}`);

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.log(`Debug: User not found - ${email}`);
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    console.log(`Debug: User found - ${email}, verified: ${user.is_verified}`);

    const bcrypt = require('bcrypt');
    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log(`Debug: Password valid: ${validPassword}`);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Debug login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Set up routes (JWT auth, cart, user, etc.)
app.use('/api', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', contactRoutes);
app.use('/api', dunaApiRoutes);
app.use('/api', cartRoutes);

// Basic route for checking if server is running
app.get('/', (req, res) => {
  res.send('API server je aktivní');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Došlo k chybě na serveru' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
});

