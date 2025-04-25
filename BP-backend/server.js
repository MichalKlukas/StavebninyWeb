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
const orderRoutes = require('./routes/orderRoutes'); // New order routes
const productRoutes = require('./routes/productRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Load environment variables
dotenv.config();
console.log('Node environment:', process.env.NODE_ENV);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from /var/www/html
app.use('/images', express.static('/var/www/html/images'));

// CORS configuration - PLACE THIS FIRST, before other middleware
app.use((req, res, next) => {
  // Allow specific origins
  const allowedOrigins = [
    'https://stavebninylysa.cz',
    'https://www.stavebninylysa.cz',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

  // Set to true if you need the website to include cookies in the requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Now include the standard cors middleware as a backup
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'https://stavebninylysa.cz',
        'https://www.stavebninylysa.cz',
        'http://localhost:5173',
        'http://localhost:3000'
      ];
      // Allow requests with no origin (mobile apps, curl requests)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// *** Security Header Middleware ***
// This sets the Permissions-Policy header to disable features you don't intend to use.
//app.use((req, res, next) => {
//  res.setHeader(
//    "Permissions-Policy",
//    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
//  );
//  next();
//});

// Middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    const safeBody = { ...req.body };
    if (safeBody.password) {
      safeBody.password = '***'; // Maskuj heslo
    }
    if (safeBody.currentPassword) {
      safeBody.currentPassword = '***';
    }
    if (safeBody.newPassword) {
      safeBody.newPassword = '***';
    }
    console.log('Sanitized request body:', safeBody);
  }
  next();
});

// Set up routes (JWT auth, cart, user, etc.)
app.use('/api', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', contactRoutes);
app.use('/api', dunaApiRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes); // Add new order routes
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);

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

