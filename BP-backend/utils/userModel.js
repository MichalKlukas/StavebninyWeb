const db = require('../config/db');
const bcrypt = require('bcrypt');

const userModel = {
  // Vytvoření nového uživatele
  async create(userData) {
    const { 
      first_name, last_name, email, password, phone, 
      company_name, street, city, zip_code,
      terms_accepted, privacy_accepted, marketing_accepted, 
      verification_token, google_id, is_verified = false 
    } = userData;

    // Hashování hesla
    const password_hash = password ? await bcrypt.hash(password, 10) : null;

    const query = `
      INSERT INTO users (
        first_name, last_name, email, password_hash, phone, 
        company_name, street, city, zip_code,
        terms_accepted, privacy_accepted, marketing_accepted,
        verification_token, google_id, is_verified
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, first_name, last_name, email, phone, is_verified
    `;

    const values = [
      first_name, last_name, email, password_hash, phone,
      company_name || null, street || null, city || null, zip_code || null,
      terms_accepted, privacy_accepted, marketing_accepted,
      verification_token, google_id || null, is_verified
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Nalezení uživatele podle e-mailu
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  },

  // Nalezení uživatele podle ID
  async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Nalezení uživatele podle Google ID
  async findByGoogleId(googleId) {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await db.query(query, [googleId]);
    return result.rows[0];
  },

  // Aktualizace informací o uživateli
  async update(id, updateData) {
    const keys = Object.keys(updateData);
    const values = Object.values(updateData);

    // Vytvoření dynamických placeholderů pro UPDATE dotaz
    const placeholders = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const query = `
      UPDATE users 
      SET ${placeholders}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  },

  // Aktualizace tokenu pro reset hesla
  async setResetPasswordToken(email, token, expires) {
    const query = `
      UPDATE users
      SET reset_password_token = $1, reset_password_expires = $2
      WHERE email = $3
      RETURNING id
    `;
    
    const result = await db.query(query, [token, expires, email]);
    return result.rows[0];
  },

  // Ověření uživatele (potvrzení e-mailu)
  async verifyUser(token) {
    const query = `
      UPDATE users
      SET is_verified = true, verification_token = NULL
      WHERE verification_token = $1
      RETURNING id, email
    `;
    
    const result = await db.query(query, [token]);
    return result.rows[0];
  },

  // Změna hesla
  async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    
    const query = `
      UPDATE users
      SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL
      WHERE id = $2
      RETURNING id
    `;
    
    const result = await db.query(query, [password_hash, id]);
    return result.rows[0];
  }
};

module.exports = userModel;