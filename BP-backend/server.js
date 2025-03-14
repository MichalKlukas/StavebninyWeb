const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
console.log('Node environment:', process.env.NODE_ENV);

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const dunaApiRoutes = require('./routes/dunaApiRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS - allow requests from localhost and Vercel
app.use(cors({
  origin: ['http://localhost:5173', 'https://stavebniny-web.vercel.app'],
  credentials: true
}));

// Middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up routes
app.use('/api', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', contactRoutes);
app.use('/api', dunaApiRoutes);

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
