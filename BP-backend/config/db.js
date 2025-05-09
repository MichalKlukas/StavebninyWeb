const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Test připojení
pool.connect()
  .then(() => console.log('Připojení k databázi úspěšné'))
  .catch(err => console.error('Chyba připojení k databázi:', err));

module.exports = {
  query: (text, params) => pool.query(text, params)
};