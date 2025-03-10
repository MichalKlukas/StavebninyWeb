const express = require('express');
const cors = require('cors');
require('dotenv').config();
console.log('Node environment:', process.env.NODE_ENV);

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const dunaApiRoutes = require('./routes/dunaApiRoutes'); // Přidaný import

// Inicializace Express aplikace
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', contactRoutes);
app.use('/api', dunaApiRoutes); // Přidaný router pro DUNA API

// Základní route pro kontrolu, že server běží
app.get('/', (req, res) => {
  res.send('API server je aktivní');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Došlo k chybě na serveru' });
});

// Spuštění serveru
app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
});